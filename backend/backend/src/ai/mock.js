export async function runMockPipeline({ imagePaths }) {
  // simulate pipeline time
  await new Promise((r) => setTimeout(r, 1200));
  const studio = { imagesProcessed: imagePaths.length };

  await new Promise((r) => setTimeout(r, 900));
  const damage = { issues: ["Old bamperda tirnalish aniqlandi (demo)"] };

  await new Promise((r) => setTimeout(r, 1000));
  const recognition = { query: "chevrolet malibu (demo)", similarIds: [] };

  return { studio, damage, recognition };
}
