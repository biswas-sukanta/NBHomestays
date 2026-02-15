import { test, expect } from '@playwright/test';

test.describe('Gate 3: Booking Handshake (Transaction)', () => {

    test('Book a homestay: select dates, submit, verify redirect', async ({ page }) => {
        // Step 1: Login first (booking requires authentication)
        await page.goto('/login');
        await page.fill('input[placeholder="Email address"]', 'guest@example.com');
        await page.fill('input[placeholder="Password"]', 'password');

        const [loginResponse] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/auth/authenticate'), { timeout: 15000 }),
            page.click('button[type="submit"]'),
        ]);
        expect(loginResponse.status()).toBe(200);
        await expect(page).toHaveURL('/', { timeout: 10000 });

        // Step 2: Navigate to a known homestay detail page
        await page.goto('/homestays/33333333-3333-3333-3333-333333333333');
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Step 3: Open the date picker
        const datePickerButton = page.locator('button#date');
        await expect(datePickerButton).toBeVisible({ timeout: 10000 });
        await datePickerButton.click();

        // Step 4: Select dates — pick two dates in the calendar
        // Wait for calendar popover to appear (react-day-picker v9 with shadcn)
        const calendarRoot = page.locator('[data-slot="calendar"]').first();
        await expect(calendarRoot).toBeVisible({ timeout: 5000 });

        // Navigate forward one month to ensure plenty of selectable future days
        const nextButton = calendarRoot.locator('button.rdp-button_next');
        await nextButton.click();
        await page.waitForTimeout(500);

        // In react-day-picker v9 + shadcn, day buttons use data-day attribute
        // Disabled days are inside td with data-disabled="true"
        const availableDays = calendarRoot.locator('td:not([data-disabled="true"]) > button[data-day]');
        const dayCount = await availableDays.count();
        console.log(`Available days in calendar: ${dayCount}`);

        expect(dayCount, 'No available days found in calendar').toBeGreaterThanOrEqual(2);

        // Click check-in date (pick a day near the start)
        const checkInIdx = Math.min(4, dayCount - 2);
        await availableDays.nth(checkInIdx).click();
        await page.waitForTimeout(300);

        // Click check-out date (a few days later)
        const checkOutIdx = Math.min(checkInIdx + 3, dayCount - 1);
        await availableDays.nth(checkOutIdx).click();
        await page.waitForTimeout(300);

        // Close the calendar by pressing Escape (h1 is obscured by sticky nav)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Step 5: Click "Reserve" and capture the booking API response
        const reserveButton = page.locator('button:text("Reserve")');
        await expect(reserveButton).toBeVisible({ timeout: 5000 });

        const [bookingResponse] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/bookings') && res.request().method() === 'POST', { timeout: 15000 }),
            reserveButton.click(),
        ]);

        const bookingStatus = bookingResponse.status();
        console.log(`Booking API response: ${bookingStatus}`);

        let bookingBody = '';
        try { bookingBody = await bookingResponse.text(); } catch { bookingBody = '<unreadable>'; }
        console.log(`Booking body: ${bookingBody.substring(0, 200)}`);

        // Assert booking was successful (200 or 201)
        expect(bookingStatus, `Booking returned ${bookingStatus}: ${bookingBody.substring(0, 100)}`).toBeLessThanOrEqual(201);
        expect(bookingStatus).toBeGreaterThanOrEqual(200);

        // Assert redirect to /bookings
        await expect(page).toHaveURL('/bookings', { timeout: 10000 });

        await page.screenshot({ path: 'gate3-booking-pass.png', fullPage: true });
    });
});
