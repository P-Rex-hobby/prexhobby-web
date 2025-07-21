import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

type RequestConfig = AxiosRequestConfig & {
  noTips?: boolean
}

const instance = axios.create({
  baseURL: "http://localhost:9999",
  //baseURL:"http://192.168.122.249:9999",
  timeout: 50000,
  withCredentials: false,
})
function sendPostMessage(type: string, data?: any) {
  window.postMessage({
    type,
    data,
  }, '*');
}
instance.interceptors.request.use(
  (config: any) => {
    sendPostMessage('request-start',{pathname:window.location.pathname});
    //config.headers.Authorization = `${token}`;
    config.headers.site = sessionStorage.getItem('site') || ''
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  },
)

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    sendPostMessage('request-completed',{pathname:window.location.pathname});
    return response.data
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // redirect to login
      window.location.href = '/auth/login'
    }
    sendPostMessage('request-completed',{pathname:window.location.pathname});
    return Promise.reject(error)
  },
)

export default function request<T = any>(config: RequestConfig): Promise<T> {
  return instance(config)
}
