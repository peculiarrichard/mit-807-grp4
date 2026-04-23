from main import app

# Vercel entry point
handler = app

if __name__ == "__main__":
    app.run(debug=True)
