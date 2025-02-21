import { Transport } from '@elastic/elasticsearch'
import { TransportRequestParams, TransportRequestOptions, TransportRequestCallback } from '@elastic/elasticsearch/lib/Transport'
import fetch from 'node-fetch'

export class CustomTransport extends Transport {
  request(params: TransportRequestParams, options: TransportRequestOptions, callback: TransportRequestCallback): void {
    const requestOptions = {
      method: params.method,
      headers: {
        'Content-Type': 'application/json',
        ...params.headers
      },
      body: params.body ? JSON.stringify(params.body) : undefined
    }

    const url = this.buildRequestUrl(params)

    fetch(url, requestOptions)
      .then(async (response) => {
        const body = await response.text()
        const headers = Object.fromEntries(response.headers.entries())
        
        callback(null, {
          body,
          statusCode: response.status,
          headers,
          warnings: headers['warning'] ? [headers['warning']] : []
        })
      })
      .catch((err) => {
        callback(err, null)
      })
  }

  private buildRequestUrl(params: TransportRequestParams): string {
    const url = new URL(params.path, this.url.href)
    if (params.querystring) {
      url.search = params.querystring
    }
    return url.toString()
  }
} 