import { PrismaClient } from "@prisma/client";
import * as fs from "fs"

const prisma = new PrismaClient()
const jsonFile = fs.readFileSync('./prisma/seeddata.json', 'utf-8')
const staticData = JSON.parse(jsonFile)
async function main() {
    console.log("Init seed datas...")

    const querys : any = []
    for(var idx in Object.keys(staticData)) {
        const key = parseInt(idx) + 1
        const menu = staticData[key]
        const update_menu = {
            id: key,
            name: menu.name,
            en_name: menu.en_name,
            thumbnail: menu.thumbnail,
            category: menu.category,
        }
        querys.push(update_menu)
    }
    await prisma.$transaction([
        ...querys.map(query => 
        prisma.menu.update({
            data: query,
            where: { id: query.id }
        }))
    ])
}

(async function () {
    await main()
    .then(_=> {
        console.log("Successful updated menus.")
        prisma.$disconnect()
    })
    .catch(err => {
        console.log("Failed update menus.\n", err)
        prisma.$disconnect()
    })
})()