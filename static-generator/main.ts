import fs from "fs";
import mustache from "mustache";

enum MenuParserState {
  NAME = "Name",
  STARTERS = "Entrées",
  DISHES = "Plats",
  DESERTS = "Desserts",
}

interface MenuItem {
  name: string;
  description: string;
  price: string;
}

interface IntermediateMenu {
  name: string;
  deserts: MenuItem[];
  starters: MenuItem[];
  dishes: MenuItem[];
}
interface MenuParts {
  name: string;
  items: MenuItem[];
}
interface Menu {
  name: string;
  parts: MenuParts[];
}

const lines = fs
  .readFileSync("./data.txt")
  .toString()
  .split("\n")
  .map((e) => e.trim());

function splitByRestaurants(): string[][] {
  const unparsedMenues: string[][] = [];
  let currentMenu: string[] = [];
  lines.forEach((line) => {
    if (line === "---") {
      unparsedMenues.push(currentMenu);
      currentMenu = [];
      return;
    }

    if (line.length > 0) currentMenu.push(line);
  });

  unparsedMenues.push(currentMenu);

  return unparsedMenues;
}

function parseMenu(tokens: string[]): Menu {
  let state: MenuParserState = MenuParserState.NAME;

  const menu: IntermediateMenu = {
    name: "",
    deserts: [],
    dishes: [],
    starters: [],
  };

  let currentItem: MenuItem = { description: "", name: "", price: "" };

  const parseMenuItem = (
    token: string,
    container: MenuItem[],
    nextState: MenuParserState
  ) => {
    if (currentItem.name.length === 0) {
      currentItem.name = token;
      return;
    }
    if (currentItem.description.length === 0) {
      currentItem.description = token;
      return;
    }
    if (currentItem.price.length === 0) {
      currentItem.price = token;
      container.push(currentItem);
      currentItem = { description: "", name: "", price: "" };
    }
  };

  const nextState = (token: string) => {
    if (!["Entrées", "Plats", "Desserts"].includes(token)) return false;

    state = token as MenuParserState;
    return true;
  };

  for (const token of tokens) {
    if (nextState(token)) continue;

    switch (state as MenuParserState) {
      case MenuParserState.NAME:
        menu.name = token;
        break;
      case MenuParserState.STARTERS:
        parseMenuItem(token, menu.starters, MenuParserState.DISHES);
        break;
      case MenuParserState.DISHES:
        parseMenuItem(token, menu.dishes, MenuParserState.DESERTS);
        break;
      case MenuParserState.DESERTS:
        parseMenuItem(token, menu.deserts, MenuParserState.DISHES);
        break;

      default:
        break;
    }
  }

  return {
    name: menu.name,
    parts: [
      { name: "Entrées", items: menu.starters },
      { name: "Plats", items: menu.dishes },
      { name: "Desserts", items: menu.deserts },
    ],
  };
}

function renderMenues(menues: Menu[]) {
  const namesToFiles: Record<string, { file: string; thumbnail: string }> = {
    "La palette du goût": {
      file: "la-palette-du-gout.html",
      thumbnail: "/images/restaurants/jay-wennington-N_Y88TWmGwA-unsplash.jpg",
    },
    "Le délice des sens": {
      file: "le-delice-des-sens.html",
      thumbnail: "/images/restaurants/jay-wennington-N_Y88TWmGwA-unsplash.jpg",
    },
    "La note enchantée": {
      file: "la-note-enchantee.html",
      thumbnail: "/images/restaurants/jay-wennington-N_Y88TWmGwA-unsplash.jpg",
    },
    "À la française": {
      file: "a-la-francaise.html",
      thumbnail: "/images/restaurants/jay-wennington-N_Y88TWmGwA-unsplash.jpg",
    },
  };

  const template = fs.readFileSync("template.mustache").toString();
  menues.forEach((menue) => {
    const { file, thumbnail } = namesToFiles[menue.name];
    const content = mustache.render(template, { ...menue, thumbnail });
    fs.writeFileSync("../restaurants/" + file, content);
  });
}

const menues = splitByRestaurants().map(parseMenu);
// fs.writeFileSync("./restaurants.json", JSON.stringify(menues, null, 2));
renderMenues(menues);
