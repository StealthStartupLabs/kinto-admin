/* @flow */
import type { SessionState, SettingsState } from "../types";

import React, { PureComponent } from "react";

import BaseForm from "./BaseForm";
import { debounce, getServerByPriority, omit } from "../utils";

const ANONYMOUS_AUTH = "anonymous";
const anonymousAuthData = server => ({
  authType: ANONYMOUS_AUTH,
  server: server,
});
const KNOWN_AUTH_METHODS = [
  "basicauth",
  "account",
  "fxa",
  "ldap",
  "portier",
  "openid",
];

type ServerHistoryProps = {
  id: string,
  value: string,
  placeholder: string,
  options: Object,
  onChange: string => void,
};

type ServerHistoryState = {
  menuOpened: boolean,
};

class ServerHistory extends PureComponent<
  ServerHistoryProps,
  ServerHistoryState
> {
  constructor(props) {
    super(props);
    this.state = { menuOpened: false };
  }

  select = server => {
    return event => {
      event.preventDefault();
      this.props.onChange(server);
      this.setState({ menuOpened: false });
      this.debouncedFetchServerInfo(server);
    };
  };

  toggleMenu = () => {
    this.setState({ menuOpened: !this.state.menuOpened });
  };

  clear = event => {
    event.preventDefault();
    const { clearHistory } = this.props.options;
    clearHistory();
    this.setState({ menuOpened: false });
  };

  onServerChange = event => {
    const server = event.target.value;
    this.props.onChange(server);
    // Do not try to fetch server infos if the field value is invalid.
    if (event.target.validity && event.target.validity.valid) {
      this.debouncedFetchServerInfo(server);
    }
  };

  fetchServerInfo = server => {
    // Server changed, request its capabilities to check what auth methods it
    // supports.
    const { getServerInfo, serverChange } = this.props.options;
    serverChange();
    getServerInfo(anonymousAuthData(server));
  };

  debouncedFetchServerInfo = debounce(this.fetchServerInfo, 500);

  render() {
    const { menuOpened } = this.state;
    const { id, value, placeholder, options } = this.props;
    const { history, pattern } = options;
    return (
      <div className="input-group server-url">
        <input
          type="text"
          id={id}
          className="form-control"
          placeholder={placeholder}
          pattern={pattern}
          value={value}
          onChange={this.onServerChange}
        />
        <div className={`input-group-btn ${menuOpened ? "open" : ""}`}>
          <button
            type="button"
            className="btn btn-default dropdown-toggle"
            onClick={this.toggleMenu}>
            <span className="caret" />
          </button>
          <ul className="dropdown-menu dropdown-menu-right">
            {history.length === 0 ? (
              <li>
                <a onClick={this.toggleMenu}>
                  <em>No server history</em>
                </a>
              </li>
            ) : (
              history.map((server, key) => (
                <li key={key}>
                  <a href="#" onClick={this.select(server)}>
                    {server}
                  </a>
                </li>
              ))
            )}
            <li role="separator" className="divider" />
            <li>
              <a href="#" onClick={this.clear}>
                Clear
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

const baseAuthSchema = {
  type: "object",
  title: "Setup",
  required: ["server", "authType"],
  properties: {
    server: {
      type: "string",
      title: "Server",
      format: "uri",
    },
    authType: {
      type: "string",
      title: "Authentication method",
      enum: [ANONYMOUS_AUTH],
    },
  },
};

const baseUISchema = {
  server: {
    "ui:placeholder": "https://server.com/v1",
    "ui:pattern": "^https?://.+/v\\d+/?",
  },
  authType: {
    "ui:widget": "radio",
  },
};

const loginPasswordSchema = function(title) {
  return {
    credentials: {
      type: "object",
      title: title,
      required: ["username", "password"],
      properties: {
        username: {
          type: "string",
          title: "Username",
        },
        password: {
          type: "string",
          title: "Password",
        },
      },
    },
  };
};

const loginPasswordUiSchema = {
  credentials: {
    password: { "ui:widget": "password" },
  },
};

const authSchemas = {
  account: {
    schema: {
      ...baseAuthSchema,
      required: [...baseAuthSchema.required, "credentials"],
      properties: {
        ...baseAuthSchema.properties,
        ...loginPasswordSchema("Accounts credentials"),
      },
    },
    uiSchema: {
      ...baseUISchema,
      ...loginPasswordUiSchema,
    },
  },
  basicauth: {
    schema: {
      ...baseAuthSchema,
      required: [...baseAuthSchema.required, "credentials"],
      properties: {
        ...baseAuthSchema.properties,
        ...loginPasswordSchema("BasicAuth credentials"),
      },
    },
    uiSchema: {
      ...baseUISchema,
      ...loginPasswordUiSchema,
    },
  },
  anonymous: {
    schema: {
      ...baseAuthSchema,
    },
    uiSchema: {
      ...baseUISchema,
    },
  },
  fxa: {
    schema: {
      ...baseAuthSchema,
    },
    uiSchema: {
      authType: {
        ...baseUISchema.authType,
        "ui:help": (
          <span>
            <b>Note:</b> The
            <a href="https://github.com/mozilla-services/kinto-fxa">
              {" kinto-fxa "}
            </a>
            plugin must be installed on the target server.
          </span>
        ),
      },
    },
  },
  openid: {
    schema: {
      ...baseAuthSchema,
      required: [...baseAuthSchema.required, "provider"],
      properties: {
        ...baseAuthSchema.properties,
        provider: {
          type: "string",
          title: "Provider",
          enum: [],
        },
      },
    },
    uiSchema: {
      ...baseUISchema,
      provider: { "ui:widget": "radio" },
    },
  },
  ldap: {
    schema: {
      ...baseAuthSchema,
      required: [...baseAuthSchema.required, "credentials"],
      properties: {
        ...baseAuthSchema.properties,
        credentials: {
          type: "object",
          title: "LDAP credentials",
          required: ["username", "password"],
          properties: {
            username: {
              type: "string",
              title: "Email",
              default: "jdoe@mozilla.com",
            },
            password: {
              type: "string",
              title: "Password",
            },
          },
        },
      },
    },
    uiSchema: {
      ...baseUISchema,
      credentials: {
        password: { "ui:widget": "password" },
      },
    },
  },
  portier: {
    schema: {
      ...baseAuthSchema,
      required: [...baseAuthSchema.required, "email"],
      properties: {
        ...baseAuthSchema.properties,
        email: {
          title: "Email address",
          type: "string",
          format: "email",
        },
      },
    },
    uiSchema: {
      authType: {
        ...baseUISchema.authType,
        "ui:help": (
          <span>
            <b>Note:</b> The
            <a href="https://github.com/Kinto/kinto-portier">
              {" kinto-portier "}
            </a>
            plugin must be installed on the target server.
          </span>
        ),
      },
    },
  },
};

const authLabels = {
  anonymous: "Anonymous",
  basicauth: "Basic Auth",
  account: "Kinto Account Auth",
  fxa: "Firefox Account",
  ldap: "LDAP",
  portier: "Portier",
  openid: "OpenID",
};

/**
 * Use the server history for the default server field value when available.
 */
function extendSchemaWithHistory(schema, history, authMethods, singleServer) {
  const serverURL = getServerByPriority(singleServer, history);
  return {
    ...schema,
    properties: {
      ...schema.properties,
      authType: {
        ...schema.properties.authType,
        enum: authMethods,
        enumNames: authMethods.map(a => authLabels[a]),
      },
      server: {
        ...schema.properties.server,
        default: serverURL,
      },
    },
  };
}

/**
 * Use the server history for the default server field value when available.
 */
function extendUiSchemaWithHistory(
  uiSchema,
  history,
  clearHistory,
  getServerInfo,
  serverChange,
  singleServer,
  singleAuthMethod
) {
  const authType = {
    authType: {
      ...uiSchema.authType,
      "ui:widget": singleAuthMethod ? "hidden" : "radio",
    },
  };

  if (singleServer) {
    return {
      ...uiSchema,
      ...authType,
      server: {
        "ui:widget": "hidden",
      },
    };
  }
  return {
    ...uiSchema,
    ...authType,
    server: {
      ...uiSchema.server,
      "ui:widget": ServerHistory,
      "ui:options": { history, clearHistory, getServerInfo, serverChange },
    },
  };
}

type AuthFormProps = {
  session: SessionState,
  history: string[],
  settings: SettingsState,
  setup: (session: Object) => void,
  serverChange: () => void,
  getServerInfo: (auth: Object) => void,
  navigateToExternalAuth: (authFormData: Object) => void,
  navigateToOpenID: (authFormData: Object, provider: Object) => void,
  clearHistory: () => void,
};

type AuthFormState = {
  schema: Object,
  uiSchema: Object,
  formData: Object,
};

export default class AuthForm extends PureComponent<
  AuthFormProps,
  AuthFormState
> {
  defaultProps = {
    history: [],
  };

  constructor(props: Object) {
    super(props);
    const { schema, uiSchema } = authSchemas[ANONYMOUS_AUTH];
    const {
      getServerInfo,
      history,
      session,
      settings: { singleServer },
    } = this.props;

    // Initialize the server URL value, by priority:
    // - single server mode
    // - most recently used
    // - default
    const server = getServerByPriority(singleServer, history);
    this.state = {
      schema,
      uiSchema,
      formData: { authType: ANONYMOUS_AUTH, server },
    };

    // TODO: make sure we only request the server info once when we get
    // redirected from an auth0 login dance (with the server we authenticated
    // with.
    // This currently doesn't work, because we initialize the component with
    // the first element from the history, and do a "get server info" and
    // replace the previous server info (the correct one).
    console.log("session data", session);
    const { serverInfo: { capabilities } } = session;
    if (Object.keys(capabilities).length === 0) {
      // TODO: this doesn't work because we're always in this case: we don't
      // get the server info from the server we used for the auth0 dance soon
      // enough.
      console.log("requesting server info");
      getServerInfo(anonymousAuthData(server));
    }
  }

  getSupportedAuthMethods = (): string[] => {
    const { session: { serverInfo: { capabilities } } } = this.props;
    // Check which of our known auth implementations are supported by the server.
    const supportedAuthMethods = KNOWN_AUTH_METHODS.filter(
      a => a in capabilities
    );
    return [ANONYMOUS_AUTH].concat(supportedAuthMethods);
  };

  onChange = ({ formData }: { formData: Object }) => {
    const { authType } = formData;
    const { uiSchema } = authSchemas[authType];
    let { schema } = authSchemas[authType];
    const specificFormData = [
      ANONYMOUS_AUTH,
      "fxa",
      "portier",
      "openid",
    ].includes(authType)
      ? omit(formData, ["credentials"])
      : { credentials: {}, ...formData };
    if (authType === "openid") {
      // Special casing openid as we need to know which provider to use.
      const { session } = this.props;
      const {
        serverInfo: {
          capabilities: { openid: { providers } = { providers: [] } },
        },
      } = session;
      schema = {
        ...schema,
        properties: {
          ...schema.properties,
          provider: {
            ...schema.properties.provider,
            enum: providers.map(provider => provider.name),
          },
        },
      };
    }
    return this.setState({
      schema,
      uiSchema,
      formData: specificFormData,
    });
  };

  onSubmit = ({ formData }: { formData: Object }) => {
    const {
      session,
      setup,
      navigateToExternalAuth,
      navigateToOpenID,
    } = this.props;
    const { authType } = formData;
    const { redirectURL } = session;
    const extendedFormData = { ...formData, redirectURL };
    switch (authType) {
      case "fxa":
      case "portier": {
        return navigateToExternalAuth(extendedFormData);
      }
      case "openid": {
        const { provider } = formData;
        const { session } = this.props;
        const {
          serverInfo: {
            capabilities: { openid: { providers } = { providers: [] } },
          },
        } = session;
        const providerData = providers.find(p => p.name === provider);
        if (!providerData) {
          throw "Couldn't find provider data in the state. Bad.";
        }
        console.log("providerData", providerData);
        return navigateToOpenID(extendedFormData, providerData);
      }
      // case "anonymous":
      // case "ldap":
      // case "basicauth":
      // case "account":
      default: {
        return setup(extendedFormData);
      }
    }
  };

  render() {
    const {
      history,
      clearHistory,
      getServerInfo,
      serverChange,
      settings,
    } = this.props;
    const { schema, uiSchema, formData } = this.state;
    const { singleServer } = settings;
    const authMethods = this.getSupportedAuthMethods();
    const singleAuthMethod = authMethods.length === 1;
    const finalSchema = extendSchemaWithHistory(
      schema,
      history,
      authMethods,
      singleServer
    );
    const finalUiSchema = extendUiSchemaWithHistory(
      uiSchema,
      history,
      clearHistory,
      getServerInfo,
      serverChange,
      singleServer,
      singleAuthMethod
    );
    return (
      <div className="panel panel-default">
        <div className="panel-body">
          <BaseForm
            schema={finalSchema}
            uiSchema={finalUiSchema}
            formData={formData}
            onChange={this.onChange}
            onSubmit={this.onSubmit}>
            <button type="submit" className="btn btn-info">
              {"Sign in using "}
              {authLabels[formData.authType]}
            </button>
          </BaseForm>
        </div>
      </div>
    );
  }
}
