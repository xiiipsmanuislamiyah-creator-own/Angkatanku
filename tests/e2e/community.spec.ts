import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
import { TEST_PASSWORD } from "../helpers";
const origin = "http://127.0.0.1:4173";
async function login(page: Page, username = "member") {
  const r = await page.request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { username, password: TEST_PASSWORD },
  });
  expect(r.ok()).toBeTruthy();
}
async function ready(page: Page) {
  await expect(page.locator(".cinematic-stage")).toHaveCount(0, {
    timeout: 20000,
  });
  await expect(page.locator("main > div").first()).toHaveCSS("opacity", "1");
  await expect(page.locator("main .ak-loading")).toHaveCount(0);
}
test.beforeEach(async ({ page, request }) => {
  await request.post("/__test/reset");
  await page.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "127.0.0.1" ||
    r.request().url().startsWith("data:")
      ? r.continue()
      : r.abort(),
  );
});
test("member publishes real feed identity, bookmarks, comments, deletes own comment and edits caption", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page);
  await page.goto("/feed");
  await ready(page);
  await page
    .getByRole("button", { name: "Buat postingan", exact: true })
    .click();
  await page
    .getByLabel("Caption", { exact: true })
    .fill("Kabar dummy: <img src=x onerror=alert(1)>");
  await page.getByLabel("Dapat dilihat").selectOption("public");
  await page.getByRole("button", { name: "Publikasikan", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const post = page.locator(".ak-post").filter({ hasText: "Kabar dummy:" });
  await expect(post.getByText("Dummy member", { exact: true })).toBeVisible();
  await expect(post.locator("img[src=x]")).toHaveCount(0);
  await post.getByRole("button", { name: "Simpan postingan" }).click();
  await expect(
    post.getByRole("button", { name: "Simpan postingan" }),
  ).toHaveAttribute("aria-pressed", "true");
  await post.getByRole("button", { name: "Buka komentar" }).click();
  await page.getByLabel("Komentar", { exact: true }).fill("Komentar dummy");
  await page
    .getByRole("button", { name: "Kirim komentar", exact: true })
    .click();
  await expect(page.getByText("Komentar dummy", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Hapus komentar", exact: true })
    .click();
  await page.getByRole("button", { name: "Konfirmasi", exact: true }).click();
  await expect(
    page.getByText("Komentar dihapus", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup dialog" }).click();
  await post.getByRole("button", { name: "Opsi postingan" }).click();
  await page
    .getByRole("button", { name: "Edit postingan", exact: true })
    .click();
  await page
    .getByLabel("Caption", { exact: true })
    .fill("Kabar dummy diperbarui");
  await page.getByRole("button", { name: "Publikasikan", exact: true }).click();
  await expect(
    page.getByText("Kabar dummy diperbarui", { exact: true }),
  ).toBeVisible();
});
test("text Story preview/viewer and twelve-photo album preserve upload order and cover", async ({
  page,
}) => {
  await login(page);
  await page.goto("/feed");
  await ready(page);
  await page.getByRole("button", { name: /Tambah Story/ }).click();
  await page
    .getByLabel("Teks Story", { exact: true })
    .fill("Kenangan dummy untuk hari ini");
  await page.getByRole("button", { name: "Warna paper" }).click();
  await page.getByRole("button", { name: "Publikasikan", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Lihat Story Dummy member" }).click();
  await page.getByRole("button", { name: "Jeda Story" }).click();
  await expect(page.locator(".ak-story-stage")).toContainText("Kenangan dummy");
  await page.getByRole("button", { name: "Tutup dialog" }).click();
  await page.goto("/albums");
  await ready(page);
  await page.getByRole("button", { name: "Buat album", exact: true }).click();
  await page
    .getByLabel("Judul album", { exact: true })
    .fill("Album dummy dua belas");
  const png = await sharp({
    create: { width: 4, height: 4, channels: 3, background: "#008e70" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("Pilih media", { exact: true })
    .setInputFiles(
      Array.from({ length: 12 }, (_, i) => ({
        name: "dummy-" + i + ".png",
        mimeType: "image/png",
        buffer: png,
      })),
    );
  await page
    .getByRole("button", { name: "Jadikan sampul", exact: true })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Publikasikan", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Album dummy dua belas", exact: true }),
  ).toBeVisible();
  const r = await page.request.post("/api/data/query", {
    headers: { Origin: origin },
    data: { collection: "albums" },
  });
  const item = (await r.json()).items[0];
  expect(item.media.length).toBe(12);
  expect(item.media.map((x: any) => x.order)).toEqual(
    Array.from({ length: 12 }, (_, i) => i),
  );
  expect(item.coverIndex).toBe(3);
  await login(page, "owner");
  await page.goto("/feed");
  await page.getByRole("button", { name: "Lihat Story Dummy member" }).click();
  await page.getByRole("button", { name: "Hapus Story", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Konfirmasi hapus Story" });
  await confirmation.getByLabel("Kata sandi Anda").fill(TEST_PASSWORD);
  await confirmation.getByRole("button", { name: "Ya, hapus Story" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Lihat Story Dummy member" })).toHaveCount(0);
});
test("global chat send, DM discovery, privacy block, Nusa reply and Memory contribution", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page);
  await page.goto("/chat");
  await ready(page);
  await page.getByRole("button", { name: /Guru & Angkatan/ }).click();
  await page.getByLabel("Pesan", { exact: true }).fill("Sapaan dummy global");
  await page.getByRole("button", { name: "Kirim pesan", exact: true }).click();
  await expect(
    page.getByText("Sapaan dummy global", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke daftar chat" }).click();
  await page.getByRole("button", { name: "Percakapan baru" }).click();
  await page.getByRole("button", { name: /Dummy other/ }).click();
  await page.getByLabel("Pesan", { exact: true }).fill("Pesan pribadi dummy");
  await page.getByRole("button", { name: "Kirim pesan", exact: true }).click();
  await expect(
    page.getByText("Pesan pribadi dummy", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Privasi pesan" }).click();
  await page
    .getByRole("button", { name: "Blokir Dummy other", exact: true })
    .click();
  await page.getByRole("button", { name: "Tutup dialog" }).click();
  await expect(page.getByText(/Akun ini Anda blokir/)).toBeVisible();
  await page.goto("/nusa-ai");
  await ready(page);
  await page.getByLabel("Pertanyaan untuk Nusa").fill("Ada jadwal angkatan?");
  await page.getByRole("button", { name: "Kirim pertanyaan" }).click();
  await expect(
    page.getByText("Jawaban dummy untuk pengujian.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nusa Memory", exact: true }).click();
  await page
    .getByRole("button", { name: "Kontribusi cerita", exact: true })
    .click();
  await page.getByLabel("Judul", { exact: true }).fill("Festival dummy");
  await page
    .getByLabel("Cerita", { exact: true })
    .fill("Sebuah cerita dummy yang cukup panjang.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Kirim untuk ditinjau" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Festival dummy" }),
  ).toBeVisible();
});
for (const width of [320, 360, 390, 480, 768, 1024, 1440])
  test(
    "new routes readable without horizontal overflow or runtime errors at " +
      width,
    async ({ page }) => {
      test.setTimeout(150000);
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await login(page);
      for (const route of [
        "home",
        "feed",
        "chat",
        "nusa-ai",
        "albums",
        "anggota",
        "guru",
        "mading",
      ]) {
        await page.goto("/" + route);
        await ready(page);
        await expect(page.locator("main")).toBeVisible();
        if (route === "nusa-ai") expect(await page.evaluate(() => window.scrollY)).toBe(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          route,
        ).toBe(false);
        // Check actual visible page components; overflow:hidden alone must not mask a clipped column.
        const clipped = await page
          .locator(
            ".ak-page-heading,.ak-feed-column,.ak-chat,.ak-ai-panel,.ak-nav-inner,.ak-bottom-nav",
          )
          .evaluateAll((els) =>
            els
              .filter((el: any) => el.offsetParent !== null)
              .filter((el) => {
                const r = el.getBoundingClientRect();
                return r.left < -1 || r.right > innerWidth + 1;
              })
              .map((el) => el.className),
          );
        expect(clipped, route).toEqual([]);
        if ([390, 1440].includes(width))
          await page.screenshot({
            path: "test-results/v2-" + route + "-" + width + ".png",
            fullPage: true,
          });
      }
      expect(errors).toEqual([]);
    },
  );
