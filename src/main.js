import {Telegraf, session} from 'telegraf'
import process from "nodemon";
import config from "config"
import {code} from "telegraf/format";
import {message} from "telegraf/filters";
import {ogg} from "./ogg.js"
import {openAi} from "./openAi.js";

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))
const INITIAL_SESSION = {
    messages: []
}


bot.use(session())

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Привет, тебя приветствует бот созданный Morrigan.Задавай свои вопросы и я с особой вежливость и учтивостью отвечу тебе!')
})

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду новых вопросов')
})

bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply('Думаю...')
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)

        const text = await openAi.transcription(mp3Path)
        await ctx.reply(code(`Ты спросил...${text}`))
        ctx.session.messages.push({role: openAi.roles.USER, content: text})

        const response = await openAi.chat(ctx.session.messages)
        ctx.session.messages.push({role: openAi.roles.ASSISTANT, content: response.content})

        await ctx.reply(code(`Отвечаю! ${response.content}`))
    } catch (e) {
        console.log(`Error while voice message ${e.message}`)
    }
})

bot.on(message('text'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply('Думаю...')
        ctx.session.messages.push({role: openAi.roles.USER, content: ctx.message.text})

        const response = await openAi.chat(ctx.session.messages)
        ctx.session.messages.push({role: openAi.roles.ASSISTANT, content: response.content})

        await ctx.reply(code(`Отвечаю! ${response.content}`))
    } catch (e) {
        console.log(`Error while voice message ${e.message}`)
    }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))