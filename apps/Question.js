import plugin from '../../../lib/plugins/plugin.js'
import { fetch } from '../components/midjourney/queID.js'
import { getPic } from '../components/midjourney/getPic.js'

export class Question extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'MJ-查询',
            /** 功能描述 */
            dsc: 'Midjourney 查询',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1009,
            rule: [{
                /** 命令正则匹配 */
                reg: '^/mj question.*$',
                /** 执行方法 */
                fnc: 'Question',
            }],
        })
    }

    async Question(e) {
        // 判断命令中是否有任务ID
        let reg = /^\/mj question (\d+)$/
        let match = e.msg.match(reg)
        let taskId = ''
        if (!match) {
            taskId = await redis.get(`midjourney:taskId:${e.user_id}`)
        } else {
            taskId = match[1]
        }
        if (!taskId) {
            e.reply(`您还没有提交过绘图任务，请先使用/mj imagine提交绘图任务，任务保存时间为30分钟`)
            return true
        }
        let response = await fetch(taskId)
        if (response.data) {
            let action = response.data.action
            let status = response.data.status
            let progress = response.data.progress
            let description = response.data.description ? response.data.description : ''
            let failReason = response.data.failReason ? response.data.failReason : ''
            let msg = `${description}\n\n[${action}]\n[${status}] [${progress}]\n${failReason}`
            e.reply(msg, true)
        } else {
            e.reply(`Midjourney API返回错误：[${response.data.code} ${response.data.description}]`, true)
        }
        if (response.data.status == 'SUCCESS'){
            const base64 = await getPic(response.data)
			let resReply = await e.reply([{ ...segment.image(`base64://${base64}`), origin: true }, `任务耗时：${(response.data.finishTime - response.data.startTime) / 1000}s`], true)
			if (!resReply) {
				e.reply(`发送图像失败，可能是因为图像过大，或无法访问图像链接\n图像链接：${response.data.imageUrl}`)
			}
        }
        return true
    }
}