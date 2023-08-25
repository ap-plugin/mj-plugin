import fs from 'fs'
import { Main } from '../apps/Main.js'
import Config from '../components/Config.js'
import { pluginRoot } from '../model/path.js'
import Log from '../utils/logs.js'

class Init {
  constructor () {
    this.initConfig()
  }

  initConfig () {
    const config_default_path = `${pluginRoot}/config/config_default.yaml`
    if (!fs.existsSync(config_default_path)) {
      Log.e('默认设置文件不存在，请检查或重新安装插件')
      return true
    }
    const config_path = `${pluginRoot}/config/config/config.yaml`
    if (!fs.existsSync(config_path)) {
      Log.e('设置文件不存在，将使用默认设置文件')
      fs.copyFileSync(config_default_path, config_path)
    }
    const config_default_yaml = Config.getDefConfig()
    const config_yaml = Config.getConfig()
    for (const key in config_default_yaml) {
      if (!(key in config_yaml)) {
        config_yaml[key] = config_default_yaml[key]
      }
    }
    for (const key in config_yaml) {
      if (!(key in config_default_yaml)) {
        delete config_yaml[key]
      }
    }
    Config.setConfig(config_yaml)
  }

  initClient () {
    if (
      Config.getConfig().server_id &&
      Config.getConfig().channel_id &&
      Config.getConfig().salai_token
    ) {
      try {
        Log.i('正在尝试登录 Midjourney Bot...')
        Main()
      } catch (err) {
        Log.e('自启动登录 Midjourney Bot 失败', err)
      }
    }
  }
}

export default new Init()
