const url = "https://sm.com.br/wp-json/";

let totalPages = 0;
let atualPage = 1;
let done = false;
let loading = false;
let category = 0;
let counterNewsnetter = 0;
let hasNewsletter = false;

startPostPage(url);

// Main Functions

/**
 *
 * @param {*} url Url de acesso aos posts
 * @description Inicializa os 10 primeiros posts da pagina,
 * os valores de numero de página e a categoria
 */
function startPostPage(url) {
  changeLoadingStatus(true);
  if (!!document.querySelector("#catReference"))
    category = +document.querySelector("#catReference").innerHTML.trim();
  axios
    .get(url + createURL(category, atualPage))
    .then(async function (response) {
      // handle success
      console.log(response);
      const posts = response.data;
      await populatePosts(posts);
      updateValuesAndContents(+response.headers["x-wp-totalpages"]);

      document.getElementsByTagName("body")[0].onscroll = function () {
        scrollPosts();
      };

      // document.querySelector("body").addEventListener("scroll", function () {});
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
      changeLoadingStatus(false);
    });
}

/**
 *
 * @returns void
 * @description Função chamada quando a tela e scrollada
 * - Verifica se já não está em processo de adição de novos posts
 * - Verifica se ainda tem novas paginas
 * - Verifica se o srcoll chegou no ponto de ação do código
 *
 * Chama a @function callMorePosts para inserir os novos posts
 */
function scrollPosts() {
  if (loading) return;
  if (done) {
    if (!document.querySelector(".no-more-data").classList.contains("nmd-show"))
      document.querySelector(".no-more-data").classList.add("nmd-show");
    return;
  }
  const pc = atualPage < 5 ? 0.5 : 0.75;
  if (
    (window.pageYOffset || document.documentElement.scrollTop) <
    document.documentElement.scrollHeight * pc
  ) {
    console.log("not today");
    return;
  }

  console.log("today!");
  changeLoadingStatus(true);
  console.log("call more posts", atualPage);
  callMorePosts(url, atualPage);
}

/**
 *
 * @param {string} url Url de acesso aos posts
 * @param {number} atualPage Página à ser acessada
 *
 * - Solicita os novos posts
 * - Atualiza preenche os posts acessados na tela com a @func populatePosts
 * - Atualiza os valores de controle e os contents com a @func updateValuesAndContents
 */
function callMorePosts(url, atualPage) {
  axios
    .get(url + createURL(category, atualPage))
    .then(async function (response) {
      // handle success
      console.log(response);
      const posts = response.data;
      await populatePosts(posts);
      updateValuesAndContents(+response.headers["x-wp-totalpages"]);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
      changeLoadingStatus(false);
    });
}

function createURL(category, page) {
  const partialCategoryParam = category !== 0 ? `&categories=${category}` : "";

  return `wp/v2/posts?page=${page}${partialCategoryParam}`;
}

/**
 *
 * @param {any[]} posts Conjunto de posts
 * @returns Template string's criadas
 * @desc
 *
 * - Mapeia os posts criando pra cada um seu proprio elemento
 * - Itera sobre os elementos criados e insere antes do fim da div.posts
 * - Verifica o counter do box da Newsletter para a sua inserção a cada 5 posts com
 * a @func insertNewsletter
 */
async function populatePosts(posts) {
  const elements = posts.map((post) => {
    switch (post.fields.post_format) {
      case "Twitter e Youtube": {
        console.log("here -> Twitter e Youtube");
        return createTwitterPost(post);
      }

      case "News": {
        console.log("here -> News");
        return createNewsPost(post);
      }

      case "External News": {
        console.log("here -> External News");
        return createExternalNewsPost(post);
      }

      case "Instagram": {
        console.log("here -> Instagram");
        return createInstagramPost(post);
      }

      case "Facebook": {
        console.log("here -> Facebook");
        return createFacebookPost(post);
      }

      case "Youtube - Versão Embed": {
        console.log("here -> Youtube - v2");
        return createYoutubePost(post);
      }

      default:
        console.log("here -> default");

        return createTwitterPost(post);
    }
  });

  elements.forEach((element) => {
    if (counterNewsnetter === 5) {
      insertNewsletter(posts[0].fields.categoryName);
    }

    const divPost = document.createElement("div");
    divPost.classList.add("post");
    divPost.innerHTML = element;

    document
      .querySelector(".posts")
      .insertAdjacentElement("beforeend", divPost);

    counterNewsnetter++;
  });

  if (!hasNewsletter) {
    insertNewsletter(posts[0].fields.categoryName);
  }
  return elements;
}

/**
 *
 * @param {string} category
 * @description Cria o box de inscrição na Newsletter com a @function createNewsletterBox
 * e o insere no fim da div.posts
 *
 */
function insertNewsletter(category) {
  const el = createNewsletterBox(category);

  const divPost = document.createElement("div");
  divPost.classList.add("archive__newsletter");
  divPost.innerHTML = el;

  document.querySelector(".posts").insertAdjacentElement("beforeend", divPost);

  counterNewsnetter = 0;
}

// Auxiliar Functions

/**
 *
 * @param {boolean} status Status do loading
 * @description Checa se o loading está sendo ativado ou desativado, para determinar se vai
 * mostrar ou esconder o box de loading na tela
 */
function changeLoadingStatus(status) {
  loading = status;

  const loadingContent = document.querySelector(".loading-content");
  if (loading) {
    loadingContent.classList.add("l-show");
  } else {
    loadingContent.classList.remove("l-show");
  }
}

/**
 *
 * @param {number} hTotalPages Total de paginas retornado pela API
 * @desc Atualiza os valores necessarios após a inserção dos valores
 */
function updateValuesAndContents(hTotalPages) {
  totalPages = hTotalPages;
  atualPage++;
  done = totalPages <= atualPage;

  setTimeout(() => {
    if (typeof window.instgrm !== "undefined") {
      window.instgrm.Embeds.process();
    }

    if (typeof twttr !== "undefined") {
      twttr.widgets.load();
    }
  }, 300);
}

/**
 *
 * @param {any} post Post da API
 * @returns Template string do Post
 */
function createNewsPost(post) {
  return `
  <div class="ft__post">
	<div class="ft__img">
		<a href="${post.link}">
		<div>
			<img src="${post.fields.postImageUrl}" alt="" />
		</div>
		</a>
	</div>
	<div class="ft__text-content">
    <a href="${post.fields.categoryUrl}" class="ft__post-category">
    <img src="${post.fields.categoryImageUrl}" /> 
    ${post.fields.categoryName}
		</a>
		<div class="ft__titles-content">
			<a
				href="${post.link}"
				class="ft__post-title"
				><p>${post.title.rendered}</p></a
			>
			<p class="ft__subtitle">
				${post["subtitle"]}
			</p>

		</div>
		<p class="ft__author">${!!post["author"] ? "De " + post["author"] : ""}</p>
	</div>
</div>
`;
}

/**
 *
 * @param {any} post Post da API
 * @returns Template string do Post
 */
function createExternalNewsPost(post) {
  return `
  <div class="ft__post">
	<div class="ft__img">
		<a href="${post["external-link"]}" rel="noopener noreferrer" target="_blank">
		<div>
			<img src="${post.fields.postImageUrl}" alt="" />
		</div>
		</a>
	</div>
	<div class="ft__text-content">
		<a href="${post.fields.categoryUrl}" class="ft__post-category">
			<img src="${post.fields.categoryImageUrl}" /> 
			${post.fields.categoryName}
		</a>
		<div class="ft__titles-content">
			<a
				href="${post["external-link"]}"
				rel="noopener noreferrer"
				target="_blank"
				class="ft__post-title"
				><p>${post.title.rendered}</p></a
			>
			<p class="ft__subtitle">
				${post["subtitle"]}
			</p>

		</div>
		<p class="ft__author">${!!post["author"] ? "De " + post["author"] : ""}</p>
	</div>
</div>
`;
}

/**
 *
 * @param {any} post Post da API
 * @returns Template string do Post
 */
function createFacebookPost(post) {
  const src = post["facebook-embed"]
    .split('"')
    .filter((partial) => partial.includes("https"))[0]
    .split("&width")[0];

  const iframe = `
    <iframe
    src="${src}"
    style="border: none; overflow: hidden"
    scrolling="no"
    frameborder="0"
    allowfullscreen="true"
    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
  ></iframe>
  `;

  return `<div class="embed__post embed__post_v2">
  <div class="embed_titles">
      ${
        !(post["hide-title"].toLowerCase() === "true")
          ? `<p class="embed__title">
      ${post.title.rendered}
  </p>
  <p class="embed__subtitle">
      ${post.subtitle}
  </p> `
          : ""
      }
  </div>
  <div class="embed__content embedded-content">
      ${iframe}
  </div>
</div>`;
}

/**
 *
 * @param {any} post Post da API
 * @returns Template string do Post
 */
function createInstagramPost(post) {
  return `<div class="embed__post">
  <div class="embed_titles">
      ${
        !(post["hide-title"].toLowerCase() === "true")
          ? `<p class="embed__title">
      ${post.title.rendered}
  </p>
  <p class="embed__subtitle">
      ${post.subtitle}
  </p> `
          : ""
      }
  </div>
  <div class="embed__content">
      ${post["instagram-embed"]}
  </div>
</div>`;
}

/**
 *
 * @param {any} post Post da API
 * @returns Template string do Post
 */
function createYoutubePost(post) {
  const src = post["youtube-embed"]
    .split('"')
    .filter((partial) => partial.includes("https"))[0];

  console.log("yt", src);

  const iframe = `
  <iframe
  src="${src}"
  title="${post.title.rendered}"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>

  `;

  return `<div class="embed__post embed__post_v2">
    <div class="embed_titles">
        ${
          !(post["hide-title"].toLowerCase() === "true")
            ? `<p class="embed__title">
        ${post.title.rendered}
    </p>
    <p class="embed__subtitle">
        ${post.subtitle}
    </p> `
            : ""
        }
    </div>
    <div class="embed__content embedded-content yt-embed">
        ${iframe}
    </div>
  </div>`;
}

/**
 *
 * @param {any} post Post da API
 * @returns Template string do Post
 */
function createTwitterPost(post) {
  return post.content.rendered;
}

/**
 *
 * @param {any} post Post da API
 * @returns Template string do Post
 */
function createNewsletterBox(category) {
  return `

		<h3 style="text-align: center;">
			Não perca as novidades do(a) <br> ${category}
		</h3>
		<h5 style="text-align: center;">
			Preencha aqui o seu email!
		</h5>
		<form>
			<input class="f__email" type="email"/>
			<input class="f__submit" type="submit" value="Cadastrar"/>
		</form>

  `;
}
