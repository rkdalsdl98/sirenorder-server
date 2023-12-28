import { PrismaClient } from "@prisma/client";
import * as fs from "fs"

const prisma = new PrismaClient()
const jsonFile = fs.readFileSync('./prisma/seeddata.json', 'utf-8')
const staticData = JSON.parse(jsonFile)
async function main() {
    console.log("Update detail datas...")

    await prisma.$transaction(async tx => {
        const menus = await tx.menu.findMany({ include: { detail: { select: { id: true } } }})
        let key: number = 0;
        for(var menu of menus) {
            const detail = staticData[++key]['detail'];
            await tx.menudetail.update({
                where: { id: menu.detail!.id },
                data: {
                    allergys: detail.allergys,
                    description: detail.description,
                    price: detail.price,
                },
            })
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