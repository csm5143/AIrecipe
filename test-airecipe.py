from playwright.sync_api import sync_playwright

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console errors
    def handle_console(msg):
        if msg.type == 'error':
            errors.append(f"[ERROR] {msg.text}")

    page.on('console', handle_console)

    # Test home page
    print("Testing home page: http://localhost:5175/")
    page.goto('http://localhost:5175/')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    title = page.title()
    print(f"  Title: {title}")

    # Check key elements exist
    hero_title = page.locator('.hero-title').count()
    print(f"  Hero title elements: {hero_title}")

    nav = page.locator('.site-header').count()
    print(f"  Header: {nav}")

    features = page.locator('.feature-card').count()
    print(f"  Feature cards: {features}")

    # Test dark mode toggle
    toggle = page.locator('.theme-toggle').count()
    print(f"  Theme toggle: {toggle}")

    if toggle > 0:
        page.locator('.theme-toggle').click()
        page.wait_for_timeout(500)
        theme = page.evaluate("document.documentElement.getAttribute('data-theme')")
        print(f"  After toggle, theme: {theme}")
        # Toggle back
        page.locator('.theme-toggle').click()

    # Test download page
    print("\nTesting download page: http://localhost:5175/#/download")
    page.goto('http://localhost:5175/#/download')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    dl_title = page.locator('.download-title').count()
    print(f"  Download title: {dl_title}")

    faq_items = page.locator('.faq-item').count()
    print(f"  FAQ items: {faq_items}")

    # Screenshot
    page.screenshot(path='C:/Users/Admin/Desktop/AIrecipe/preview-home.png', full_page=True)
    print("\nScreenshot saved: preview-home.png")

    page.goto('http://localhost:5175/#/download')
    page.wait_for_timeout(1000)
    page.screenshot(path='C:/Users/Admin/Desktop/AIrecipe/preview-download.png', full_page=True)
    print("Screenshot saved: preview-download.png")

    browser.close()

if errors:
    print(f"\nConsole errors found ({len(errors)}):")
    for e in errors:
        print(f"  {e}")
else:
    print("\nNo console errors found.")
