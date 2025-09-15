import { PrismaClient } from "@prisma/client";
import slugify from 'slugify'

const prisma = new PrismaClient();

async function main() {
    const categories = [
        "General Offering",
        "Special Seed",
        "Global Service Sponsorship",
        "Save a Life Campaign",
        "Global Outreach",
    ];

    for (const name of categories) {
        const slug = slugify(name, {lower:true, strict:true});
        await prisma.category.upsert({
            where: { slug},
            update: {},
            create: {name, slug}
        })
    }

    console.log("Categories seeded successfully");

    // Currencies
    const currencies = [
        { code: "NGN", symbol: "₦", name: "Naira" },
        { code: "USD", symbol: "$", name: "US Dollar" },
        { code: "EUR", symbol: "€", name: "Euro" },
        { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
        { code: "GBP", symbol: "£", name: "Pound Sterling" },
        { code: "GHS", symbol: "₵", name: "Ghana Cedis" },
      ];

      for (const c of currencies) {
        await prisma.currency.upsert({
            where: {code: c.code},
            update: {},
            create: c,
        })
      }
      console.log("✅ Seeded categories and currencies");
}

main()
.then(async () => {
    await prisma.$disconnect();
})
.catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
})