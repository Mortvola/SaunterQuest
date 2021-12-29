import React from 'react';
import ReactDOM from 'react-dom';
import 'regenerator-runtime/runtime';
import '@mortvola/usemodal/dist/main.css';
import '@mortvola/forms/dist/main.css';
import 'bootstrap/dist/css/bootstrap.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './welcome.css';
import BlogStore from './state/store';
import Main from './Main';
import Blog from './Blog';

type PropsType = {
  pathFinderUrl: string,
}

const Welcome: React.FC<PropsType> = ({ pathFinderUrl }) => (
  <>
    <Switch>
      <Route path="/blog">
        <Blog pathFinderUrl={pathFinderUrl} />
      </Route>
      <Route path="/">
        <Main />
      </Route>
    </Switch>
  </>
);

const appElement = document.querySelector('.app');
if (appElement === null) {
  throw new Error('app element could not be found');
}

const initialPropsString = appElement.getAttribute('data-props');
if (initialPropsString === null) {
  throw new Error('initialProps attribute could not be found');
}

const initialProps = JSON.parse(initialPropsString) as PropsType;

ReactDOM.render(
  <BlogStore>
    <Router>
      <Welcome pathFinderUrl={initialProps.pathFinderUrl} />
    </Router>
  </BlogStore>,
  document.querySelector('.app'),
);
