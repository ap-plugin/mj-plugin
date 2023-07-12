import axios from 'axios'
import Config from '../../components/config/config.js'
import Log from '../../utils/logs.js'

/** 
 * 指定ID获取任务
 * @param {string} id 任务ID
  * @returns
 */
export async function fetch(id) {
    let baseAPI = Config.getAPI()
    if (!baseAPI) {
        Log.e('未配置Midjourney API')
        return false
    }
    let configs = Config.getSetting()
    return await axios.get(baseAPI + `/mj/task/${id}/fetch`,
        (configs.proxy.host && configs.proxy.port) ? { proxy: { protocol: 'http', host: `${configs.proxy.host}`, port: `${Number(configs.proxy.port)}` }} : null
        )
}
