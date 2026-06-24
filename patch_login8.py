import re

with open('src/screens/LoginScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the ToastAndroid block with just setErrorMessage
old_block = """      const errorMsg = 'Usuario o contraseña incorrectos.';
      setErrorMessage(errorMsg);
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMsg, ToastAndroid.LONG);
      } else if (Platform.OS === 'web') {
        alert(errorMsg);
      }"""
      
new_block = """      const errorMsg = 'Usuario o contraseña incorrectos.';
      setErrorMessage(errorMsg);"""

content = content.replace(old_block, new_block)

with open('src/screens/LoginScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed native alerts, restored UI error box")
