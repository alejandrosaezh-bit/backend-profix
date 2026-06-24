import re

with open('src/screens/LoginScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = "  const [showErrorPopup, setShowErrorPopup] = useState(false);"
replacement = """  const [showErrorPopup, setShowErrorPopup] = useState(false);

  useEffect(() => {
    console.log("LoginScreen mounted!");
    return () => console.log("LoginScreen unmounted!");
  }, []);

  useEffect(() => {
    console.log("showErrorPopup changed to:", showErrorPopup);
  }, [showErrorPopup]);"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/screens/LoginScreen.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Debug logs added")
else:
    print("Target not found")
