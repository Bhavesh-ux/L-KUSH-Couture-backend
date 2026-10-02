import pool from "../src/config/db.js";
const categories = [
  {
    name: "Sherwani",
    description:
      "Premium sherwani collection for weddings and special occasions.",
    image_url:
      "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Kurta Pajama",
    description:
      "Elegant kurta pajama collection for festive and traditional occasions.",
    image_url:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Indo-Western",
    description:
      "Contemporary Indo-Western outfits blending modern and traditional style.",
    image_url:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Blazer",
    description:
      "Premium blazers and sophisticated formalwear for special occasions.",
    image_url:
      "https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Wedding",
    description:
      "Luxury wedding collection designed for memorable celebrations.",
    image_url:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Festive",
    description:
      "Stylish festive outfits for celebrations and cultural occasions.",
    image_url:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
  },
];



const seedCategories = async () => {
  try {
    for (const category of categories) {
      const slug = category.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      await pool.query(
        `
        INSERT INTO categories (
          name,
          slug,
          description,
          image_url
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug)
        DO NOTHING
        `,
        [
          category.name,
          slug,
          category.description,
          category.image_url,
        ]
      );

      console.log(`Category processed: ${category.name}`);
    }
  } catch (error) {
    console.error("Category seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seedCategories();