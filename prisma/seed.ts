import { PrismaClient, Prisma } from "@prisma/client";
import * as fs from "fs"

const prisma = new PrismaClient()
const jsonFile = fs.readFileSync('./prisma/seeddata.json', 'utf-8')
const staticData = JSON.parse(jsonFile)
async function main() {
    console.log("Init seed datas...")

    const feedonly = await prisma.menu.findMany()
    if(feedonly.length === 0 || feedonly.length !== Object.keys(staticData).length) {
        const querys : any = []
        for(var idx in Object.keys(staticData)) {
            const key = parseInt(idx) + 1
            const menu = staticData[key]
            const createOrUpdate = {
                id: key,
                name: menu.name,
                en_name: menu.en_name,
                price: menu.price,
                thumbnail: menu.thumbnail,
                detail: {
                    connectOrCreate: {
                        where: { id: key },
                        create: {
                            id: key,
                            description: menu.detail.description,
                            allergys: menu.detail.allergys,
                            nutritions: menu.detail.nutritions.map(n => {
                                return {
                                    id: key,
                                    size: "default",
                                    calorie: new Prisma.Decimal(n.calorie),
                                    carbohydrate: new Prisma.Decimal(n.carbohydrate),
                                    sugars: new Prisma.Decimal(n.sugars),
                                    salt: new Prisma.Decimal(n.salt),
                                    protein: new Prisma.Decimal(n.protein),
                                    fat: new Prisma.Decimal(n.fat),
                                    cholesterol: new Prisma.Decimal(n.cholesterol),
                                    transfat: new Prisma.Decimal(n.transfat),
                                    saturatedfat: new Prisma.Decimal(n.saturatedfat),
                                    caffeine: new Prisma.Decimal(n.caffeine),
                                }
                            })
                        }
                    }
                }
            }
            querys.push(createOrUpdate)
        }
        await prisma.$transaction([
            prisma.menu.deleteMany(),
            ...querys.map(query => 
            prisma.menu.upsert({
                create: query,
                update: query,
                where: { id: query.id }
            }))
        ])
    } else return
}

(async function () {
    await main()
    .then(_=> {
        console.log("Successful init seed datas.")
        prisma.$disconnect()
    })
    .catch(err => {
        console.log("Failed init seed datas.\n", err)
        prisma.$disconnect()
    })
})()