import React from 'react';
import { render } from 'react-dom';
import { HttpLink } from 'apollo-link-http'
import {ApolloLink, split} from 'apollo-link'
import ApolloClient from 'apollo-client'
import {InMemoryCache, IntrospectionFragmentMatcher} from 'apollo-cache-inmemory'
import { onError } from 'apollo-link-error'
import { createBrowserHistory } from 'history';
import { ApolloProvider } from 'react-apollo';
import introspectionQueryResultData from './fragmentTypes';
import Chatbox from "./components/Chatbox";
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import {message} from 'antd';

const httpLink = new HttpLink({
    uri: 'http://localhost:9996/api/graphql',
});

const wsLink = new WebSocketLink({
    uri: `ws://localhost:9996/api/graphql/subscriptions`,
    options: {
        timeout: 1000*1000*1000,
        reconnect: true,
        connectionCallback: (error, result) => {
            if (error) {
                message.error("connect to ws server failed: " + error)
            } else {
                message.success("connect to ws server successfully!")
            }
        }
    }
});

const fragmentMatcher = new IntrospectionFragmentMatcher({
    introspectionQueryResultData,
});

export const cache = new InMemoryCache({
    fragmentMatcher,
});
export const history = createBrowserHistory();

const errLink = onError(
    ({ graphQLErrors, networkError, operation, forward }) => {
        if (graphQLErrors) {
            for (const err of graphQLErrors) {
                console.log(`[GraphQL error]: ${err}`)
            }
        }
        if (networkError) {
            console.log(`[Network error]: ${networkError}`)
            // if you would also like to retry automatically on
            // network errors, we recommend that you use
            // apollo-link-retry
        }
    }
);

const link = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink,
);

export const apolloClient = new ApolloClient({
    cache,
    link: ApolloLink.from([
        errLink,
        link,
    ]),
    connectToDevTools: true,
});


function App() {
    return (
        <ApolloProvider client={apolloClient}>
            <Chatbox/>
        </ApolloProvider>
    )
}

render(<App />, document.querySelector('#root'));
