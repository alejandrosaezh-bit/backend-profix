import re

with open('App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Currently:
#             {/* NAV INFERIOR */}
#             <BottomNav

replacement = """            {/* NAV INFERIOR */}
            {!(view === 'profile' && userMode === 'pro') && (
                <BottomNav
                    view={view}
                    userMode={userMode}
                    isLoggedIn={isLoggedIn}
                    counts={counts}
                    setView={setView}
                    loadRequests={() => fetchRequests(userMode)}
                    setShowAuth={setShowAuth}
                    markAllProInteractionsAsRead={markAllProInteractionsAsRead}
                />
            )}"""

# regex search to replace the <BottomNav ... /> block
import re
new_content = re.sub(
    r"\{\/\* NAV INFERIOR \*\/}[^<]*<BottomNav[^>]*/>",
    replacement,
    content
)

if new_content == content:
    print("Could not find BottomNav block")
    # let's try a simpler replacement
    # find <BottomNav and />
    start_idx = content.find("<BottomNav")
    end_idx = content.find("/>", start_idx) + 2
    
    if start_idx != -1 and end_idx != -1:
        new_content = content[:start_idx] + "{!(view === 'profile' && userMode === 'pro') && (\n                " + content[start_idx:end_idx] + "\n            )}" + content[end_idx:]
        
with open('App.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated App.js to conditionally hide BottomNav")
