import {matchRoutes} from "react-router-config";

import AppContainer from "./components/App";
import HomeContainer from "./components/Home";
import NoMatch from "./components/NoMatch";

/*
Contains config of main routes.
Custom parameters of route:
- name
  Used to identify current route
- title
  Used to show title of current page to user
- backRoute
  Route path the back button should lead to

`title` and `backRoute` can be either a string, either a function.
If it is a function, then it will receive `routeMatch` as params. Function must return string.
*/
export const mainRoutes = [
  {
    component: AppContainer,
    routes: [
      {
        path: "/",
        exact: true,
        component: HomeContainer,
        name: "home",
        title: "Точки Wahoo"
      },
      {
        path: "/travel/labs/wahoo-points/",
        exact: true,
        params: {"lang": "ru"},
        component: HomeContainer,
        name: "home-ru",
        title: "Точки Wahoo"
      },
      {
        path: "/en/travel/labs/wahoo-points/",
        params: {"lang": "en"},
        exact: true,
        component: HomeContainer,
        name: "home-en",
        title: "Wahoo Points"
      },
      {
        component: NoMatch,
        name: "notfound",
        title: "Not found"
      },
    ]
  }
];

export function getCurrentRouteParams() {
  let routeName;
  let routeTitle;
  let backRoute;

  const exactRoutes = matchRoutes(mainRoutes, window.location.pathname).filter(m => {
    return m.match.isExact;
  }).sort((a) => a.route.title ? -1 : 1);  // put route with title to the top of results

  if (exactRoutes && exactRoutes[0]) {
    const exactRoute = exactRoutes[0];
    const titleObj = exactRoute.route.title;
    const backObj = exactRoute.route.backRoute;
    routeName = exactRoute.route.name;
    routeTitle = titleObj instanceof Function ? titleObj(exactRoute.match) : titleObj;
    backRoute = backObj instanceof Function ? backObj(exactRoute.match) : backObj;
  }

  return {routeName, routeTitle, backRoute};
}
