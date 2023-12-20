import { PrismaClient } from "@prisma/client";
import * as fs from "fs"

const prisma = new PrismaClient()
const jsonFile = fs.readFileSync('./prisma/seeddata.json', 'utf-8')
const staticData = JSON.parse(jsonFile)
async function main() {
    console.log("Update nutritions datas...")

    await prisma.$transaction(async tx => {
        const details = await tx.menudetail.findMany({ include: { nutritions: { select: { id: true } } }})
        let key: number = 0;
        for(var detail of details) {
            const nutritionKeys = detail.nutritions
            const updateDatas = staticData[++key]['detail']['nutritions'];
            for(let i = 0; i<nutritionKeys.length; ++i) {
                const nutritionKey = nutritionKeys[i]
                const data = updateDatas[i]
                await tx.nutrition.update({
                    where: { id: nutritionKey.id },
                    data,
                })
            }
        }
    })
}

(async function () {
    await main()
    .then(_=> {
        console.log("Successful updated menu detail.")
        prisma.$disconnect()
    })
    .catch(err => {
        console.log("Failed update menu detail.\n", err)
        prisma.$disconnect()
    })
})()