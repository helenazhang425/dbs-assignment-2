import { test, expect } from "@playwright/test";
import { appReducer } from "../src/context/appReducer";
import { AppState } from "../src/types";

test.describe("InterviewReady interactions", () => {
  test("navigate between pages using navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Dashboard");

    await page.click("text=Applications");
    await expect(page.locator("h1")).toContainText("Applications");

    await page.click("text=Companies");
    await expect(page.locator("h1")).toContainText("Companies");

    await page.click("text=Stories");
    await expect(page.locator("h1")).toContainText("STAR Stories");

    await page.click("text=Questions");
    await expect(page.locator("h1")).toContainText("Practice Questions");
  });

  test("add a question and verify it appears", async ({ page }) => {
    await page.goto("/questions");

    // Click Add Question button
    await page.click('button:has-text("Add Question")');

    // Wait for modal
    await expect(page.locator('textarea[placeholder="Enter the interview question..."]')).toBeVisible();

    // Fill in the form
    await page.fill('textarea[placeholder="Enter the interview question..."]', "What is your greatest strength?");
    await page.fill('textarea[placeholder="Any initial notes..."]', "Focus on leadership examples");

    // Select category pill inside the modal
    await page.locator('.fixed.inset-0.z-50 button:has-text("Behavioral")').click();

    // Submit via the modal's Add Question button
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();

    // Verify the question appears on the page
    await expect(page.locator("text=What is your greatest strength?")).toBeVisible();
  });

  test("navigate to company detail page (dynamic route)", async ({ page }) => {
    await page.goto("/companies");

    // Click on Tandem company card link
    await page.locator('a[href*="/companies/"]', { hasText: "Tandem" }).click();

    // Should be on the detail page — company name is in an input, not h1
    await expect(page.locator('input[value="Tandem"]')).toBeVisible();
    await expect(page.locator("text=S&O Lead")).toBeVisible();
  });

  test("keeps notes separate when adding a second company role", async ({ page }) => {
    await page.goto("/companies/c1");

    const roleNotes = page.locator('textarea[placeholder="Anything to remember about this role..."]');

    await expect(roleNotes).toBeVisible();
    await roleNotes.fill("first role notes");

    await page.getByText("+ Add role").click();
    await page.locator('input[placeholder="Role title"]').fill("Second role");
    await roleNotes.fill("second role notes");

    await page.getByText("S&O Lead").click();
    await expect(roleNotes).toHaveValue("first role notes");

    await page.getByText("Second role").click();
    await expect(roleNotes).toHaveValue("second role notes");
  });

  test("updates a role by company index when stored role ids are duplicated", () => {
    const state = {
      questions: [],
      checklist: [],
      stories: [],
      events: [],
      applications: [],
      savedPositions: [],
      companies: [
        {
          id: "company-1",
          name: "Spring Health",
          companyUrl: "",
          whyCompany: "",
          notes: "",
          createdAt: 0,
          roles: [
            { id: "duplicate-role", title: "Senior Pricing Strategist", whyRole: "", roleUrl: "", notes: "pricing notes", status: "interviewing" as const },
            { id: "duplicate-role", title: "Associate Director", whyRole: "", roleUrl: "", notes: "director notes", status: "interviewing" as const },
          ],
        },
      ],
    } satisfies AppState;

    const nextState = appReducer(state, {
      type: "UPDATE_COMPANY_ROLE_AT_INDEX",
      payload: { companyId: "company-1", roleIndex: 1, updates: { notes: "updated director notes" } },
    });

    expect(nextState.companies[0].roles[0].notes).toBe("pricing notes");
    expect(nextState.companies[0].roles[1].notes).toBe("updated director notes");
  });

  test("filter questions by category", async ({ page }) => {
    await page.goto("/questions");

    // Click Behavioral filter pill
    await page.locator('button:has-text("Behavioral")').first().click();

    // Should show questions
    const cards = page.locator(".rounded-xl.border.bg-white");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search stories", async ({ page }) => {
    await page.goto("/stories");

    // Type in search
    await page.fill('input[placeholder="Search stories..."]', "Pfizer");

    // Should show Pfizer story
    await expect(page.locator("text=Pfizer China Generic Entry")).toBeVisible();
  });
});
