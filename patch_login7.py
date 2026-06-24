import re

with open('src/screens/LoginScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we import ToastAndroid
if "ToastAndroid" not in content:
    content = content.replace("import { Keyboard, KeyboardAvoidingView,", "import { Keyboard, KeyboardAvoidingView, ToastAndroid,")

# Replace setErrorMessage(errorMsg) with ToastAndroid/alert
replacement = """
      const errorMsg = 'Usuario o contraseña incorrectos.';
      setErrorMessage(errorMsg);
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMsg, ToastAndroid.LONG);
      } else if (Platform.OS === 'web') {
        alert(errorMsg);
      }
"""

content = content.replace("      const errorMsg = 'Usuario o contraseña incorrectos.';\n      setErrorMessage(errorMsg);", replacement)

with open('src/screens/LoginScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added ToastAndroid/alert for native error messaging")
