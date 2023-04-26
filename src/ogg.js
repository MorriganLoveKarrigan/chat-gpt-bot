import axios from "axios";
import ffmpeg from "fluent-ffmpeg"
import installer from "@ffmpeg-installer/ffmpeg"
import {createWriteStream} from "fs";
import {dirname,resolve} from "path"
import {fileURLToPath} from "url"
import {removeFile} from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url))


class OggConverter{
    constructor() {
        ffmpeg.setFfmpegPath(installer.path)
    }

    toMp3(input,output){
        try {
            const outputPath = resolve(dirname(input),`${output}.mp3`)
            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOption('-t 30')
                    .output(outputPath)
                    .on('end', () =>{
                        resolve(outputPath)
                        removeFile(input)
                    })
                    .on('error', (err) => reject(err))
                    .run()
            })
        }catch (e) {
            console.log(`Error while converting to mp3 filename: ${e.message}`)
        }
    }
    async create(url,fileName){
        try{
            const oggPath = resolve(__dirname,"../voices/",`${fileName}.ogg`)
            const response = await axios({
                method:"GET",
                responseType:"stream",
                url
            })
            return new Promise(resolve => {
                const stream = createWriteStream(oggPath)
                response.data.pipe(stream)
                stream.on('finish', () => {resolve(oggPath)})
            })

        }catch (e) {
            console.log(`Error while creating file ${e.message}`)
        }
    }
}

export const ogg = new OggConverter()