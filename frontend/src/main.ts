import { storyblokInit, apiPlugin, storyblokEditable, useStoryblokBridge } from "@storyblok/js";

const { storyblokApi } = storyblokInit({
  accessToken: import.meta.env.VITE_STORYBLOK_PREVIEW_TOKEN,
  use: [apiPlugin],
  apiOptions: { region: "eu" },
});

const renderers: Record<string, (blok: any) => string> = {
  game: renderGame,
  studio: renderStudio,
  external_link: renderSingleExternalLink,
};

function refName(data: any): string {
    if (typeof(data) === `string` || data === undefined) return 'Unknown';
    return data.content?.name ?? 'Unknown';
}

function renderGame(blok) {
  // console.log(blok);
  const attrs = storyblokEditable(blok);
  let page = `<div data-blok-c='${attrs["data-blok-c"]}' data-blok-uid="${attrs["data-blok-uid"]}"><h1>${blok.name}</h1><br>${blok.description}<br><br>`;
  const studios = `Studio(s): ` + blok.studio.map((s: any) => s.content.name).join(",");
  page = page.concat(studios) + `<br><br>Social: `;

  for (let sm of blok.social_media) {
    const singleLink = renderSingleExternalLink(sm);
    page = page.concat(singleLink) + `<br><br>`;
  }
  page = page.concat("</div>");
  return page;
}

function renderStudio(blok) {
  // console.log(blok);
  const attrs = storyblokEditable(blok);
  let page = `<div data-blok-c='${attrs["data-blok-c"]}' data-blok-uid="${attrs["data-blok-uid"]}"><h1>${blok.name}</h1><br>${blok.description}<br><br>`;

  for (let sm of blok.social_media) {
    const singleLink = renderSingleExternalLink(sm);
    page = page.concat(singleLink) + `<br><br>`;
  }
  page = page.concat("</div>");
  return page
}

function renderBlok(blok) {
  return renderers[blok.component]?.(blok) ?? "";
}

function renderSingleExternalLink(link: any) {
  console.log(link);
  const attrs = storyblokEditable(link);
  return `<div data-blok-c='${attrs["data-blok-c"]}' data-blok-uid="${attrs["data-blok-uid"]}"><a href = "https://${link.url.url}">${refName(link.platform[0])}</a></div>`
}

function reRender(newStory: any) {
  document.querySelector("#app")!.innerHTML = renderBlok(newStory.content);
}

const path = window.location.pathname === "/" ? "/games/ember-hollow" : window.location.pathname;
let data = await storyblokApi!.get(`cdn/stories${path}`, { 
  version: "draft", 
  resolve_relations: "game.genre,game.studio,game.hwt_producer,external_link.platform" });
// console.log(data.data);

document.querySelector("#app")!.innerHTML = renderBlok(data.data.story.content);

useStoryblokBridge(data.data.story.id, reRender, { resolveRelations: ["game.genre","game.studio","game.hwt_producer","external_link.platform"] })
