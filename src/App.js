import './css/buttons.css';
import './css/tooltips.css';
import './App.css';
import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Switch, Route, NavLink, Prompt } from 'react-router-dom';

import firebase from 'firebase/app';
import 'firebase/auth'; // if using authentication
import 'firebase/database'; // if using database
import { Config } from './config';
import { PageContainer } from './containers/page';
import { Markdown } from './components/markdown';
import { PeopleOnline } from './components/people-online';
import { MenuSearch } from './components/menu-search';
import { OnlineTracker } from './utils';

import {
  menuTemplate,
  companyStructureTemplate,
  productRoadmapTemplate,
  diagramsHelpTemplate,
  newPageTemplate
} from './templates';

class App extends Component {
  onBeforeUnloadText = "You have unsaved changes.\n\nAre you sure you want to close this page?";

  state = {
    loggedIn: false,
    accessDenied: false,
    hasUnsavedChanges: false,
    menu: null,
    authError: false,
    authErrorMessage: ''
  };

  constructor(props) {
    super(props);
    this.followDetailsInMenu = this.followDetailsInMenu.bind(this); // Bind the method
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onBeforeUnload);
    this.bindGlobalNavigationHelper();
    this.followDetailsInMenu();

    const config = {
      apiKey: Config.apiKey,
      authDomain: Config.authDomain,
      databaseURL: Config.databaseURL,
      projectId: Config.projectId,
      storageBucket: Config.storageBucket,
      messagingSenderId: Config.messageingSenderId
    };

    window['firebase'] = firebase;

    firebase.initializeApp(config);

    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            this.setState({ loggedIn: true });
            this.fetchMenu();
            OnlineTracker.track(this.props.location.pathname);
          } else {
            this.handleRedirect();
            this.signInUser();
          }
        });
      })
      .catch((err) => {
        this.setState({
          authError: true,
          authErrorMessage: err.message
        });
      });
  }

  handleRedirect = () => {
    if (!this.state.loggedIn) {
      firebase.auth().getRedirectResult()
        .then((result) => {
          if (result.user) {
            this.setState({ loggedIn: true });
            this.fetchMenu();
            OnlineTracker.track(this.props.location.pathname);
          }
        })
        .catch(err => {
          this.setState({
            authError: true,
            authErrorMessage: err.message
          });
        });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }

  onBeforeUnload = (e) => {
    if (this.state.hasUnsavedChanges) {
      e.preventDefault();
      return e.returnValue = this.onBeforeUnloadText;
    }
  }

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

  signInUser = () => {
    firebase.auth().signInWithPopup(this.getAuthProvider())
      .then(() => {
        // Sign-in successful
      })
      .catch(err => {
        this.setState({
          authError: true,
          authErrorMessage: err.message
        });
      });
  }

  getAuthProvider() {
    return Config.authProvider === 'github'
      ? new firebase.auth.GithubAuthProvider()
      : new firebase.auth.GoogleAuthProvider();
  }

  setupPage(ref, template) {
    firebase.database().ref(`pages/${ref}`).once('value').then((snapshot) => {
      if (!snapshot.val()) {
        firebase.database().ref(`pages/${ref}`).set({ body: template });
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

  bindGlobalNavigationHelper() {
    const re = new RegExp('^' + window.location.origin);
    window.navigateTo = (event, url) => {
      if (re.test(url)) {
        event.preventDefault();
        url = url.substring(window.location.origin.length);
        this.props.history.push(url);
      } else if (/^https?:/.test(url) === false) {
        event.preventDefault();
        this.props.history.push(url);
      }
    };
  }

  componentDidUpdate(prevProps) {
    this.followDetailsInMenu();
    if (this.props.location.pathname !== prevProps.location.pathname) {
      OnlineTracker.track(this.props.location.pathname);
    }
  }

  render() {
    if (this.state.authError) {
      return this.renderAuthError();
    } else if (this.state.accessDenied) {
      return this.renderAccessDenied();
    } else if (!this.state.loggedIn) {
      return this.renderLoading();
    } else {
      return this.renderApp();
    }
  }

  renderAuthError() {
    return (
      <div className="app-error content--markdown">
        <p>Firebase app is not configured properly.</p>
        {this.state.authErrorMessage &&
          <p><strong>Error message:</strong><br />{this.state.authErrorMessage}</p>
        }
        <p><a href="" onClick={() => { firebase.auth().signOut(); return false; }}>Sign out</a></p>
      </div>
    );
  }

  renderAccessDenied() {
    return (
      <div className="app-error content--markdown">
        <p>Access denied for <strong>{firebase.auth().currentUser.email}</strong>.</p>
        <p><a href="" onClick={() => { firebase.auth().signOut(); return false; }}>Sign out</a></p>
      </div>
    );
  }

  renderLoading() {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
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

      return (
        <div>
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
        </div>
      );
    };
  }
}
export default withRouter(App);