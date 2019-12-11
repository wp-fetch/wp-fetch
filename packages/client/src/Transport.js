import base64 from 'base-64';
import queryString from 'query-string';
import FormData from 'isomorphic-form-data';
import HTTPError from './HTTPError';

export default class FetchTransport {
  constructor() {
    ['post', 'get', 'put', 'patch', 'delete'].forEach(verb => {
      this[verb] = (url, data, config) => this.request(verb, url, data, config);
    });
  }

  request(verb, url, data, config = {}) {
    const request = {
      ...config,
      method: verb.toUpperCase()
    };

    if (data && (Object.keys(data).length !== 0 || data instanceof FormData)) {
      if ('PUT PATCH POST'.indexOf(verb.toUpperCase()) > -1) {
        request.body = data instanceof FormData ? data : JSON.stringify(data);
      } else {
        if (data instanceof FormData) {
          throw new TypeError(
            'Unable to encode FormData for GET, DELETE requests'
          );
        }
        const qs = queryString.stringify(data, {
          arrayFormat: 'bracket'
        });
        url = `${url}?${qs}`;
      }
    }

    request.headers = new Headers(config.headers);

    if (config && config.auth && config.auth.username && config.auth.password) {
      request.headers.set(
        'Authorization',
        'Basic ' +
          base64.encode(`${config.auth.username}:${config.auth.password}`)
      );
    }

    return fetch(url, request).then(async response => {
      const data = await response.json();
      if (!response.ok) {
        throw new HTTPError(data);
      }
      return data;
    });
  }
}
