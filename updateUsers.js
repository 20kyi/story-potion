const admin = require("firebase-admin");
admin.initializeApp({
    credential: admin.credential.cert(require("./serviceAccountKey.json")),
});
const db = admin.firestore();

const defaultFields = {
    authProvider: "password",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    emailVerified: false,
    eventEnabled: false,
    fcmToken: "",
    isActive: true,
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    marketingEnabled: false,
    point: 0,
    reminderEnabled: false,
    reminderTime: "",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    photoURL: "",
};

async function updateMissingFields() {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    const updates = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        const updateData = {};

        for (const [key, value] of Object.entries(defaultFields)) {
            if (data[key] === undefined) {
                updateData[key] = value;
            }
        }

        if (Object.keys(updateData).length > 0) {
            updates.push(usersRef.doc(doc.id).update(updateData));
            console.log(`업데이트: ${doc.id}`, updateData);
        }
    });

    await Promise.all(updates);
    console.log("모든 누락 필드 업데이트 완료!");
}

updateMissingFields().catch(console.error); 