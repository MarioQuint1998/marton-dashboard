import admin from 'firebase-admin';

// Initialize Firebase Admin only once
let firebaseApp;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  try {
    // Check if already initialized
    firebaseApp = admin.apps.length > 0 ? admin.apps[0] : admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });

    return firebaseApp;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

export async function fetchFirebaseUserData(startDate, endDate) {
  try {
    const app = getFirebaseApp();
    const db = admin.firestore(app);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
    }));

    // Get all projects/videos
    const projectsSnapshot = await db.collection('projects').get();
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
    }));

    // Filter users created in date range
    const usersInRange = users.filter(user => {
      const createdAt = user.createdAt;
      return createdAt >= startDate && createdAt <= endDate;
    });

    // Calculate total userbase
    const totalUserbase = users.length;

    // Users who made any purchase (subscription or single)
    const payingUsers = users.filter(user => 
      user.hasSubscription || user.hasPurchased || user.purchaseCount > 0
    );

    // Users with active subscription
    const subscribedUsers = users.filter(user => 
      user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
    );

    // Conversion rates
    const freeUsers = users.filter(user => !user.hasSubscription && !user.hasPurchased);
    const conversionFreeToSub = totalUserbase > 0 
      ? (subscribedUsers.length / totalUserbase) * 100 
      : 0;
    const conversionFreeToPaying = totalUserbase > 0 
      ? (payingUsers.length / totalUserbase) * 100 
      : 0;

    // Time to first purchase
    const usersWithFirstPurchase = users.filter(user => user.firstPurchaseDate);
    const avgTimeToFirstPurchase = usersWithFirstPurchase.length > 0
      ? usersWithFirstPurchase.reduce((sum, user) => {
          const created = user.createdAt;
          const firstPurchase = user.firstPurchaseDate?.toDate?.() || new Date(user.firstPurchaseDate);
          const diffDays = (firstPurchase - created) / (1000 * 60 * 60 * 24);
          return sum + diffDays;
        }, 0) / usersWithFirstPurchase.length
      : 0;

    // Video usage for subscribers
    const subscriberUsage = subscribedUsers.map(user => {
      const videosUsed = user.videosUsedThisMonth || 0;
      const videoLimit = user.monthlyVideoLimit || (user.subscriptionInterval === 'year' ? user.yearlyVideoLimit / 12 : user.monthlyVideoLimit) || 10;
      return {
        userId: user.id,
        used: videosUsed,
        limit: videoLimit,
        usagePercent: videoLimit > 0 ? (videosUsed / videoLimit) * 100 : 0,
      };
    });

    const avgUsagePercent = subscriberUsage.length > 0
      ? subscriberUsage.reduce((sum, u) => sum + u.usagePercent, 0) / subscriberUsage.length
      : 0;

    // ARPU (Average Revenue Per User)
    // This would need actual revenue data, using placeholder
    const arpu = payingUsers.length > 0 && totalUserbase > 0
      ? 0 // Will be calculated with actual Stripe data
      : 0;

    // Single buyers in period
    const singleBuyers = usersInRange.filter(user => 
      user.hasPurchased && !user.hasSubscription
    );

    return {
      totalUserbase,
      activeSubscribers: subscribedUsers.length,
      payingUsers: payingUsers.length,
      conversionFreeToSub,
      conversionFreeToPaying,
      avgTimeToFirstPurchase,
      avgUsagePercent,
      singleBuyersCount: singleBuyers.length,
      newUsersInPeriod: usersInRange.length,
      arpu,
    };
  } catch (error) {
    console.error('Error fetching Firebase data:', error);
    // Return mock data if Firebase fails
    return {
      totalUserbase: 0,
      activeSubscribers: 0,
      payingUsers: 0,
      conversionFreeToSub: 0,
      conversionFreeToPaying: 0,
      avgTimeToFirstPurchase: 0,
      avgUsagePercent: 0,
      singleBuyersCount: 0,
      newUsersInPeriod: 0,
      arpu: 0,
    };
  }
}
