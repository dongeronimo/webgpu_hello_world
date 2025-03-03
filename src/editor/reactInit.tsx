import React from 'react';
import ReactDOM from 'react-dom/client';
import Editor from './Editor';
import { Provider } from 'react-redux';
import { store } from './redux/store';


ReactDOM.createRoot(document.getElementById('reactRoot')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <Editor />
    </Provider>
  </React.StrictMode>
);