import './css/reset.css';
import './css/buttons.css';
import './css/tooltips.css';
import './App.css';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { withRouter } from 'react-router';
import { Switch, Route, NavLink, Prompt } from 'react-router-dom'
//import * as firebase from 'firebase';
//import { Config } from './config';
import { PageContainer } from './containers/page';
import { Markdown } from './components/markdown';
import { PeopleOnline } from './components/people-online';
import { MenuSearch } from './components/menu-search';
import OnlineTracker from './utils/OnlineTracker';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

import {
  menuTemplate,
  companyStructureTemplate,
  productRoadmapTemplate,
  diagramsHelpTemplate,
  newPageTemplate
} from './templates';

class App extends Component {
  state = {
    loggedIn: false,
    accessDenied: false,
    hasUnsavedChanges: false,
    menu: null,
    authError: false,
    authErrorMessage: '',
    isLoading: true
  };


  fetchMenu = () => {
    let menu = firebase.database().ref('pages/menu');
    menu.on('value', (snapshot) => {
      const menuContents = snapshot.val();
      if (menuContents) {
        this.setState({ menu: menuContents.body });
      } else {
        this.createExamplePages();
      }
    }, this.onAccessDenied);
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onBeforeUnload);
    this.bindGlobalNavigationHelper();
    this.followDetailsInMenu();
  
    const config = {
      apiKey: "AIzaSyD6_jLPqcvV43itoxTl_8Sr4j7Aam8ewyg",
      authDomain: "webnomads-kb.firebaseapp.com", // Use default Firebase domain for now
      databaseURL: "https://webnomads-kb-default-rtdb.firebaseio.com",
      projectId: "webnomads-kb",
      storageBucket: "webnomads-kb.firebasestorage.app",
      messagingSenderId: "783363300969",
    };
  
    console.log('Initializing Firebase with config:', config);
  
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
  
    // Remove redirect handling for now to simplify debugging
    this.unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'User signed in' : 'No user');
      if (user) {
        this.setState({ 
          loggedIn: true, 
          isLoading: false 
        }, () => {
          this.fetchMenu();
          OnlineTracker.track(this.props.location.pathname);
        });
      } else {
        this.handleSignIn();
      }
    });
  }
   

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  handleSignIn = async () => {
    try {
      console.log('Starting sign in process');
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      
      console.log('Attempting popup sign in');
      const result = await firebase.auth().signInWithPopup(provider);
      console.log('Sign in result:', result);
      
    } catch (error) {
      console.error('Detailed sign in error:', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential,
        fullError: error
      });
      
      this.setState({
        authError: true,
        authErrorMessage: `${error.code}: ${error.message}`,
        isLoading: false
      });
    }
  }

  onBeforeUnload = (e) => {
    if (this.state.hasUnsavedChanges) {
      e.preventDefault();
      return e.returnValue = this.onBeforeUnloadText;
    }
  }

  getAuthProvider() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    return provider;
  }

  setupPage(ref, template) {
    firebase.database().ref(`pages/${ref}`).once('value').then((snapshot) => {
      if (!snapshot.val()) {
        firebase.database().ref(`pages/${ref}`).set({
          body: template
        });
      }
    }).catch(err => {});
  }

  createExamplePages() {
    this.setupPage('menu', menuTemplate);
    this.setupPage('company-structure', companyStructureTemplate);
    this.setupPage('roadmap', productRoadmapTemplate);
    this.setupPage('project-1', newPageTemplate);
    this.setupPage('project-2', newPageTemplate);
    this.setupPage('diagrams-help', diagramsHelpTemplate);
  }

  // window.navigateTo(event, url)
  // helps components incompatible with React
  // navigate through the app
  // example: [diagram] markdown links
  bindGlobalNavigationHelper() {
    var self = this;
    const re = new RegExp('^' + window.location.origin);

    window.navigateTo = (event, url) => {
      // check if URL is in the same domain
      if (re.test(url)) {
        event.preventDefault();
        url = url.substring(window.location.origin.length);
        self.props.history.push(url);

      // check if URL is a relative path (without protocol)
      } else if (/^https?:/.test(url) === false) {
        event.preventDefault();
        self.props.history.push(url);
      }
    };
  }

  componentDidUpdate(prevProps, prevState) {
    this.followDetailsInMenu();
    if (this.props.location.pathname !== prevProps.location.pathname) {
      OnlineTracker.track(this.props.location.pathname);
    }
  }

  editModeChanged = (value) => {
    this.setState({
      editMode: value
    });
  }

  onUnsavedChanges = (value) => {
    this.setState({
      hasUnsavedChanges: value
    });
  }

  onAccessDenied = () => {
    this.setState({
      accessDenied: true
    });
  }

  openParentDetailsNode = (node) => {
    if(node){
      if(node.nodeName.toLowerCase() !== 'details')
        this.openParentDetailsNode(node.parentNode);
      else
        node.setAttribute('open', 'true');
    }
  };

  followDetailsInMenu = () => {
    const menuDOMNode = ReactDOM.findDOMNode(this.refs.menu);
    if(menuDOMNode) {
      const actives = menuDOMNode.getElementsByClassName('active');
      for (let i = 0; i < actives.length; i++) {
        this.openParentDetailsNode(actives[i]);
      }
    }
  };

  render() {
    if (this.state.authError) {
      return (
        <div className="app-error content--markdown">
          <p>Firebase app is not configured properly.</p>
          {this.state.authErrorMessage && (
            <div>
              <p><strong>Error message:</strong><br />{this.state.authErrorMessage}</p>
              <p>
                To enable popups for this site:
                <ol>
                  <li>Look for a popup blocked notification in your browser's address bar</li>
                  <li>Click it and select "Always allow popups from this site"</li>
                  <li>Then try signing in again</li>
                </ol>
              </p>
            </div>
          )}
          <p>
            <a href="" onClick={(e) => { 
              e.preventDefault(); 
              this.setState({ authError: false }, () => this.handleSignIn()); 
            }}>
              Try Again
            </a>
          </p>
        </div>
      );
    } else if (this.state.accessDenied) {
      return (
        <div className="app-error content--markdown">
          <p>Access denied for <strong>{firebase.auth().currentUser.email}</strong>.</p>
          <p><a href="" onClick={() => { firebase.auth().signOut(); return false; }}>Sign out</a></p>
        </div>
      );
    } else if (!this.state.loggedIn) {
      return (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      );
    } else {
      return this.renderApp();
    }
  }

  renderApp() {
    const wrapperClass = ['app__wrapper'];
    if (this.state.editMode) {
      wrapperClass.push('app__wrapper--edit-mode');
    }

    return (
      <div className={wrapperClass.join(' ')}>
        <div className="app__menu">
          <p className="app__menu__options">
            <a href="" onClick={() => { firebase.auth().signOut(); return false; }}>Sign out</a> | <NavLink to="/menu">Edit menu</NavLink><br /><br />
            <NavLink to="/online">Show people online</NavLink>
          </p>
          <div className="app__logo">
            <NavLink to="/"><img className="octopus" src="/static/octopus.png" alt="" /></NavLink>
          </div>

          {!this.state.menu &&
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
          }

          {this.state.menu &&
            <div>
              <MenuSearch menu={this.state.menu}/>
              <Markdown className="app__menu__container" ref="menu">
                {this.state.menu}
              </Markdown>
            </div>
          }
          
        </div>

        <div className="app__content">
          <Switch>
            <Route path="/online" component={PeopleOnline} />
            <Route render={this.renderComponentForRoute()} />
          </Switch>
        </div>
      </div>
    );
  }

  renderComponentForRoute = () => {
    return (route) => {
      const path = route.location.pathname.substring(1);
      const hash = route.location.hash;

      return <div>
        <Prompt
          when={this.state.hasUnsavedChanges}
          message={location => this.onBeforeUnloadText}
        />

        <PageContainer
          onEditModeChange={this.editModeChanged}
          onUnsavedChanges={this.onUnsavedChanges}
          onAccessDenied={this.onAccessDenied}
          path={path}
          key={path}
          hash={hash}
        />
      </div>;
    }
  }
}

export default withRouter(App);
