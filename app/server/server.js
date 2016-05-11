import Express from 'express';
import bodyParser from 'body-parser';

var fbgraph = require('fbgraphapi');

import path from 'path';

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { RoutingContext, match } from 'react-router';

import { createMemoryHistory, useQueries } from 'history';
import compression from 'compression';
import Promise from 'bluebird';

import configureStore from 'store/configureStore';
import createRoutes from 'routes/index';

import { Provider } from 'react-redux';

import fbsdk from 'facebook-sdk';

let server = new Express();
let port = process.env.PORT || 8081;
let scriptSrcs;

let styleSrc;
if ( process.env.NODE_ENV === 'production' ) {
  let assets = require('../../dist/webpack-assets.json');
  let refManifest = require('../../dist/rev-manifest.json');
  scriptSrcs = [
    `/${assets.vendor.js}`,
    `/${assets.app.js}`
  ];
  styleSrc = `/${refManifest['main.css']}`;
} else {
  scriptSrcs = [
    'http://localhost:3001/static/vendor.js',
    'http://localhost:3001/static/dev.js',
    'http://localhost:3001/static/app.js'
  ];
  styleSrc = '/main.css';
}


server.use(bodyParser.json()); // for parsing application/json
server.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

server.use(compression());
server.use(Express.static(path.join(__dirname, '../..', 'dist')));
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'ejs');

// mock apis
server.get('/api/questions', (req, res)=> {
  let { questions } = require('./mock_api');
  res.send(questions);
});

server.get('/api/users/:id', (req, res)=> {
  let { getUser } = require('./mock_api')
  res.send(getUser(req.params.id))
})
server.get('/api/questions/:id', (req, res)=> {
  let { getQuestion } = require('./mock_api')
  res.send(getQuestion(req.params.id))
})

server.post('/api/connectFB', function(req, res){
console.log('req.body', req.body);
  var fb = new fbgraph.Facebook(req.body.access_token, 'v2.2');
  fb.post('/' + req.body.page_id + '/feed', {message: req.body.message, link: req.body.link},function(err, response) {
      res.json({
        err: err,
        response: response,
      });
  });

//  console.log('body', req.body);
//  console.log('params', req.params);
//  var facebook = new fbsdk.Facebook({
//      appId  : req.body.appId,
//      secret : req.body.secret,
//
//    });
//
////    facebook.api('/' + req.body.appId, function(data) {
////      res.json({
////          statusCode: -1,
////          data: data
////        });
////    });
//
//    facebook.api('/468756293189056?fields=name', function(data) {
//      res.json({
//          statusCode: -1,
//          data: data
//        });
//    });
})


server.get('*', (req, res, next)=> {
  let history = useQueries(createMemoryHistory)();
  let store = configureStore();
  let routes = createRoutes(history);
  let location = history.createLocation(req.url);

  match({ routes, location }, (error, redirectLocation, renderProps) => {
    if (redirectLocation) {
      res.redirect(301, redirectLocation.pathname + redirectLocation.search);
    } else if (error) {
      res.status(500).send(error.message);
    } else if (renderProps == null) {
      res.status(404).send('Not found')
    } else {
      let [ getCurrentUrl, unsubscribe ] = subscribeUrl();
      let reqUrl = location.pathname + location.search;

      getReduxPromise().then(()=> {
        let reduxState = escape(JSON.stringify(store.getState()));
        let html = ReactDOMServer.renderToString(
          <Provider store={store}>
            { <RoutingContext {...renderProps}/> }
          </Provider>
        );

        if ( getCurrentUrl() === reqUrl ) {
          res.render('index', { html, scriptSrcs, reduxState, styleSrc });
        } else {
          res.redirect(302, getCurrentUrl());
        }
        unsubscribe();
      })
      .catch((err)=> {
        unsubscribe();
        next(err);
      });
      function getReduxPromise () {
        let { query, params } = renderProps;
        let comp = renderProps.components[renderProps.components.length - 1].WrappedComponent;
        let promise = comp.fetchData ?
          comp.fetchData({ query, params, store, history }) :
          Promise.resolve();

        return promise;
      }
    }
  });
  function subscribeUrl () {
    let currentUrl = location.pathname + location.search;
    let unsubscribe = history.listen((newLoc)=> {
      if (newLoc.action === 'PUSH') {
        currentUrl = newLoc.pathname + newLoc.search;
      }
    });
    return [
      ()=> currentUrl,
      unsubscribe
    ];
  }
});

server.use((err, req, res, next)=> {
  console.log(err.stack);
  // TODO report error here or do some further handlings
  res.status(500).send("something went wrong...")
})

console.log(`Server is listening to port: ${port}`);
server.listen(port);
