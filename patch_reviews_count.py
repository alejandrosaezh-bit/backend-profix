import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

bad_logic = "const currentCatReviews = reviews.filter(r => r.category === catKey);"

good_logic = """const currentCatReviews = (reviews || []).filter(rev => {
                    let revCat = null;
                    if (rev.jobCategory) {
                        revCat = typeof rev.jobCategory === 'object' ? (rev.jobCategory.name || rev.jobCategory.fullName) : rev.jobCategory;
                    } else if (rev.job && rev.job.category) {
                        revCat = typeof rev.job.category === 'object' ? (rev.job.category.name || rev.job.category.fullName) : rev.job.category;
                    }
                    if (!revCat) return catKey === 'General';
                    return String(revCat).toLowerCase() === String(catKey).toLowerCase();
                });"""

content = content.replace(bad_logic, good_logic)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched currentCatReviews logic")
