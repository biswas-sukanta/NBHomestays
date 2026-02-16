# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]:
      - link "NBHomestays" [ref=e4] [cursor=pointer]:
        - /url: /
      - generic [ref=e5]:
        - link "Home" [ref=e6] [cursor=pointer]:
          - /url: /
          - img [ref=e7]
          - generic [ref=e10]: Home
        - link "Explore" [ref=e11] [cursor=pointer]:
          - /url: /search
          - img [ref=e12]
          - generic [ref=e15]: Explore
        - link "Community" [ref=e16] [cursor=pointer]:
          - /url: /community
          - img [ref=e17]
          - generic [ref=e19]: Community
        - link "Login" [ref=e21] [cursor=pointer]:
          - /url: /login
  - main [ref=e22]:
    - generic [ref=e24]:
      - heading "Sign in to your account" [level=2] [ref=e26]
      - generic [ref=e27]:
        - generic [ref=e28]:
          - textbox "Email address" [ref=e30]
          - textbox "Password" [ref=e32]
        - button "Sign in" [ref=e34]
        - link "Don't have an account? Sign up" [ref=e36] [cursor=pointer]:
          - /url: /register
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e42] [cursor=pointer]:
    - img [ref=e43]
  - alert [ref=e46]
```