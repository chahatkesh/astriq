import { prisma } from "../src";

function writeInfo(message: string) {
  process.stdout.write(`${message}\n`);
}

async function main() {
  const birthChartCount = await prisma.birthChart.count();

  writeInfo(`Birth charts in database: ${birthChartCount}`);
  writeInfo("Database seed completed.");
}

void main()
  .catch((error: unknown) => {
    process.stderr.write("Database seed failed.\n");

    if (error instanceof Error) {
      process.stderr.write(`${error.message}\n`);
    } else {
      process.stderr.write(`${String(error)}\n`);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
