import axios from 'axios'
import Config from '../../components/config/config.js'

/** 
 * 查询任务队列
 * @returns
 */
export async function queue() {
    let baseAPI = Config.getAPI()
    if (!baseAPI) {
        Log.e('未配置Midjourney API')
        return false
    }
    return await axios.get(baseAPI + `/mj/task/queue`);
  }