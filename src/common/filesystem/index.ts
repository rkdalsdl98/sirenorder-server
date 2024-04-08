import * as path from "path";
import { 
    readFile, 
    appendFile,
    mkdir,
    existsSync,
} from "fs";
import { Logger } from "@nestjs/common";

const logger: Logger = new Logger("FileSystem")

export namespace FileSystem {
    /**
     * 파일의 데이터를 buffer로 가져오는 함수
     * 
     * base64로 디코딩해서 사용
     * @param folder 
     * @param file 
     * @param callback 
     * @returns 
     */
    export const read = (
        folder: string,
        file: string,
        callback: (data: Buffer) => void
    ) : void => readFile(path.join(`${folder}/${file}`), (err, data) => {
            if(err) {
                try {
                    _handleException(err)
                    return
                } catch(e) { return }
            } else if(!hasFolder(folder)) {
                logger.log("읽어오려는 파일의 위치를 읽을 수 없습니다.")
                return
            }
            callback(data)
    })

    export const hasFolder = (folder: string) : boolean => existsSync(folder)

    /**
     * 파일에 데이터를 추가하는 함수
     * 
     * 지정한 폴더가 존재하지 않을 경우 생성 합니다
     * @param folder 
     * @param file 
     * @param data 
     * @returns 
     */
    export const append = (
        folder: string,
        file_name: string,
        data: string,
    ) : void => {
        if(!hasFolder(folder)) {
            try {
                mkdir(folder, _handleException)
            } catch(e) {
                logger.log("저장 위치를 생성하는데 실패 했습니다.")
                return
            }
        }
        else if(!_IsTextFile(file_name)) {
            logger.log("텍스트 파일 이외의 파일은 저장할 수 없습니다.")
            return
        }
        appendFile(path.join(`${folder}/${file_name}`), data + "\n", _handleException)
    }

    const _IsTextFile = (file: string) => {
        const [name, extension] = file.split(".")
        if(name === undefined || extension === undefined) return false
        else if(extension !== "txt") return false
        return true
    }
    const _handleException = (err: NodeJS.ErrnoException | null) => {
        if(err) {
            logger.log(err)
            throw new Error("파일 확장자 또는 파일주소를 확인해주세요.")
        }
    }
}