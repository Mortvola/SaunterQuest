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

type PropsType = {
  tileServerUrl: string,
}

const Welcome: React.FC<PropsType> = ({ tileServerUrl }) => (
  <Main />
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
    <Welcome tileServerUrl={initialProps.tileServerUrl} />
  </BlogStore>,
  document.querySelector('.app'),
);
