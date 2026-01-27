import { User } from '../models/User';
import { Message } from '../models/Message';
import { Match } from '../models/Match';

/**
 * Mask email for privacy (j***@example.com)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get overview of user metrics
 */
export async function getUserOverview() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [overview] = await User.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        premium: [
          { $match: { isPremium: true } },
          { $count: 'count' }
        ],
        verified: [
          { $match: { verified: true } },
          { $count: 'count' }
        ],
        activeLastMonth: [
          { $match: { lastActiveAt: { $gte: oneMonthAgo } } },
          { $count: 'count' }
        ],
        newToday: [
          { $match: { createdAt: { $gte: oneDayAgo } } },
          { $count: 'count' }
        ],
        newThisWeek: [
          { $match: { createdAt: { $gte: oneWeekAgo } } },
          { $count: 'count' }
        ],
        newThisMonth: [
          { $match: { createdAt: { $gte: oneMonthAgo } } },
          { $count: 'count' }
        ]
      }
    }
  ]);

  const totalUsers = overview.total[0]?.count || 0;
  const premiumUsers = overview.premium[0]?.count || 0;
  const verifiedUsers = overview.verified[0]?.count || 0;
  const activeUsers = overview.activeLastMonth[0]?.count || 0;
  const newUsersToday = overview.newToday[0]?.count || 0;
  const newUsersThisWeek = overview.newThisWeek[0]?.count || 0;
  const newUsersThisMonth = overview.newThisMonth[0]?.count || 0;

  // Calculate growth rates
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const usersLastMonth = await User.countDocuments({
    createdAt: { $gte: twoMonthsAgo, $lt: oneMonthAgo }
  });

  const monthlyGrowthRate = usersLastMonth > 0
    ? ((newUsersThisMonth - usersLastMonth) / usersLastMonth) * 100
    : 0;

  return {
    totalUsers,
    activeUsers,
    premiumUsers,
    verifiedUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    growthRate: {
      monthly: Math.round(monthlyGrowthRate * 10) / 10
    },
    premiumConversionRate: totalUsers > 0
      ? Math.round((premiumUsers / totalUsers) * 1000) / 10
      : 0
  };
}

/**
 * Get user demographics data
 */
export async function getUserDemographics() {
  const [demographics] = await User.aggregate([
    {
      $facet: {
        gender: [
          {
            $group: {
              _id: '$gender',
              count: { $sum: 1 }
            }
          }
        ],
        ageGroups: [
          {
            $addFields: {
              age: {
                $dateDiff: {
                  startDate: '$dateOfBirth',
                  endDate: '$$NOW',
                  unit: 'year'
                }
              }
            }
          },
          {
            $bucket: {
              groupBy: '$age',
              boundaries: [18, 25, 35, 45, 55, 100],
              default: 'unknown',
              output: {
                count: { $sum: 1 }
              }
            }
          }
        ],
        countries: [
          { $match: { 'location.country': { $exists: true, $ne: null } } },
          {
            $group: {
              _id: '$location.country',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        cities: [
          { $match: { 'location.city': { $exists: true, $ne: null } } },
          {
            $group: {
              _id: '$location.city',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        education: [
          { $match: { education: { $exists: true } } },
          {
            $group: {
              _id: '$education',
              count: { $sum: 1 }
            }
          }
        ],
        englishAbility: [
          { $match: { englishAbility: { $exists: true } } },
          {
            $group: {
              _id: '$englishAbility',
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);

  // Format gender data
  const genderMap: any = { male: 0, female: 0, other: 0 };
  demographics.gender.forEach((g: any) => {
    if (g._id && genderMap.hasOwnProperty(g._id)) {
      genderMap[g._id] = g.count;
    }
  });

  // Format age distribution
  const ageDistribution: any = {
    '18-24': 0,
    '25-34': 0,
    '35-44': 0,
    '45-54': 0,
    '55+': 0
  };

  demographics.ageGroups.forEach((bucket: any) => {
    if (bucket._id === 18) ageDistribution['18-24'] = bucket.count;
    else if (bucket._id === 25) ageDistribution['25-34'] = bucket.count;
    else if (bucket._id === 35) ageDistribution['35-44'] = bucket.count;
    else if (bucket._id === 45) ageDistribution['45-54'] = bucket.count;
    else if (bucket._id === 55) ageDistribution['55+'] = bucket.count;
  });

  // Format education data
  const educationMap: any = {
    'high-school': 0,
    'bachelor': 0,
    'master': 0,
    'phd': 0,
    'other': 0
  };
  demographics.education.forEach((e: any) => {
    if (e._id && educationMap.hasOwnProperty(e._id)) {
      educationMap[e._id] = e.count;
    }
  });

  // Format english ability data
  const englishMap: any = {
    'beginner': 0,
    'intermediate': 0,
    'fluent': 0,
    'native': 0
  };
  demographics.englishAbility.forEach((e: any) => {
    if (e._id && englishMap.hasOwnProperty(e._id)) {
      englishMap[e._id] = e.count;
    }
  });

  return {
    gender: genderMap,
    ageDistribution,
    topCountries: demographics.countries.map((c: any) => ({
      country: c._id,
      count: c.count
    })),
    topCities: demographics.cities.map((c: any) => ({
      city: c._id,
      count: c.count
    })),
    educationLevels: educationMap,
    englishAbility: englishMap
  };
}

/**
 * Get user growth over time
 */
export async function getUserGrowth(period: string = '30d') {
  const now = new Date();
  let startDate: Date;
  let dateFormat: string;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d';
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d';
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d';
      break;
    case '365d':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d';
      break;
    case 'all':
      const oldestUser = await User.findOne().sort({ createdAt: 1 }).select('createdAt');
      startDate = oldestUser?.createdAt || now;
      dateFormat = '%Y-%m-%d';
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d';
  }

  const growthData = await User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const labels = growthData.map((d: any) => d._id);
  const values = growthData.map((d: any) => d.count);

  // Calculate cumulative
  const cumulative: number[] = [];
  let sum = 0;
  for (const val of values) {
    sum += val;
    cumulative.push(sum);
  }

  return {
    labels,
    values,
    cumulative
  };
}

/**
 * Get top users by activity metric
 */
export async function getTopUsers(metric: string = 'messages', limit: number = 50) {
  if (metric === 'messages') {
    const topMessagers = await Message.aggregate([
      {
        $group: {
          _id: '$senderId',
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { messageCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          username: '$user.username',
          profilePhoto: '$user.profilePhoto',
          isPremium: '$user.isPremium',
          createdAt: '$user.createdAt',
          count: '$messageCount'
        }
      }
    ]);

    return {
      metric: 'messages',
      users: topMessagers
    };
  } else if (metric === 'matches') {
    const users = await User.find()
      .select('username profilePhoto isPremium createdAt matches')
      .lean();

    const sorted = users
      .map(u => ({
        _id: u._id,
        username: u.username,
        profilePhoto: u.profilePhoto,
        isPremium: u.isPremium,
        createdAt: u.createdAt,
        count: u.matches?.length || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return {
      metric: 'matches',
      users: sorted
    };
  } else if (metric === 'likes') {
    const users = await User.find()
      .select('username profilePhoto isPremium createdAt likes')
      .lean();

    const sorted = users
      .map(u => ({
        _id: u._id,
        username: u.username,
        profilePhoto: u.profilePhoto,
        isPremium: u.isPremium,
        createdAt: u.createdAt,
        count: u.likes?.length || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return {
      metric: 'likes',
      users: sorted
    };
  } else if (metric === 'profile_views') {
    const users = await User.find()
      .select('username profilePhoto isPremium createdAt profileVisitors')
      .lean();

    const sorted = users
      .map(u => ({
        _id: u._id,
        username: u.username,
        profilePhoto: u.profilePhoto,
        isPremium: u.isPremium,
        createdAt: u.createdAt,
        count: u.profileVisitors?.length || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return {
      metric: 'profile_views',
      users: sorted
    };
  }

  throw new Error('Invalid metric. Use: messages, matches, likes, or profile_views');
}

/**
 * Get message analytics
 */
export async function getMessageAnalytics() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [stats] = await Message.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        today: [
          { $match: { createdAt: { $gte: oneDayAgo } } },
          { $count: 'count' }
        ],
        week: [
          { $match: { createdAt: { $gte: oneWeekAgo } } },
          { $count: 'count' }
        ],
        month: [
          { $match: { createdAt: { $gte: oneMonthAgo } } },
          { $count: 'count' }
        ],
        aiGenerated: [
          { $match: { isAIGenerated: true } },
          { $count: 'count' }
        ],
        hourlyDistribution: [
          {
            $addFields: {
              hour: { $hour: '$createdAt' }
            }
          },
          {
            $group: {
              _id: '$hour',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]
      }
    }
  ]);

  const totalMessages = stats.total[0]?.count || 0;
  const todayMessages = stats.today[0]?.count || 0;
  const weekMessages = stats.week[0]?.count || 0;
  const monthMessages = stats.month[0]?.count || 0;
  const aiMessages = stats.aiGenerated[0]?.count || 0;

  // Calculate average messages per day (last 30 days)
  const averageMessagesPerDay = Math.round(monthMessages / 30);

  // Calculate average messages per conversation
  const totalConversations = await Match.countDocuments({ lastMessageAt: { $exists: true } });
  const averageMessagesPerConversation = totalConversations > 0
    ? Math.round(totalMessages / totalConversations)
    : 0;

  // AI percentage
  const aiGeneratedPercentage = totalMessages > 0
    ? Math.round((aiMessages / totalMessages) * 1000) / 10
    : 0;

  return {
    totalMessages,
    todayMessages,
    weekMessages,
    monthMessages,
    averageMessagesPerDay,
    averageMessagesPerConversation,
    aiGeneratedPercentage,
    topActiveHours: stats.hourlyDistribution.map((h: any) => ({
      hour: h._id,
      count: h.count
    }))
  };
}

/**
 * Get match analytics
 */
export async function getMatchAnalytics() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [stats] = await Match.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        today: [
          { $match: { createdAt: { $gte: oneDayAgo } } },
          { $count: 'count' }
        ],
        week: [
          { $match: { createdAt: { $gte: oneWeekAgo } } },
          { $count: 'count' }
        ],
        month: [
          { $match: { createdAt: { $gte: oneMonthAgo } } },
          { $count: 'count' }
        ],
        active: [
          { $match: { lastMessageAt: { $gte: sevenDaysAgo } } },
          { $count: 'count' }
        ],
        ghosted: [
          {
            $match: {
              lastMessageAt: { $exists: true, $lt: sevenDaysAgo }
            }
          },
          { $count: 'count' }
        ]
      }
    }
  ]);

  const totalMatches = stats.total[0]?.count || 0;
  const todayMatches = stats.today[0]?.count || 0;
  const weekMatches = stats.week[0]?.count || 0;
  const monthMatches = stats.month[0]?.count || 0;
  const activeConversations = stats.active[0]?.count || 0;
  const ghostedConversations = stats.ghosted[0]?.count || 0;

  // Calculate average matches per user
  const totalUsers = await User.countDocuments();
  const averageMatchesPerUser = totalUsers > 0
    ? Math.round((totalMatches * 2) / totalUsers * 10) / 10
    : 0;

  // Calculate match success rate (matches / total likes)
  const users = await User.find().select('likes matches').lean();
  let totalLikes = 0;
  users.forEach(u => {
    totalLikes += u.likes?.length || 0;
  });

  const matchSuccessRate = totalLikes > 0
    ? Math.round((totalMatches / totalLikes) * 1000) / 10
    : 0;

  return {
    totalMatches,
    todayMatches,
    weekMatches,
    monthMatches,
    averageMatchesPerUser,
    matchSuccessRate,
    activeConversations,
    ghostedConversations
  };
}

/**
 * Get engagement metrics
 */
export async function getEngagementMetrics() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dailyActiveUsers = await User.countDocuments({ lastActiveAt: { $gte: oneDayAgo } });
  const weeklyActiveUsers = await User.countDocuments({ lastActiveAt: { $gte: oneWeekAgo } });
  const monthlyActiveUsers = await User.countDocuments({ lastActiveAt: { $gte: oneMonthAgo } });

  // Calculate retention rates (simplified)
  const usersCreated30DaysAgo = await User.find({
    createdAt: {
      $gte: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000),
      $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }).select('_id lastActiveAt').lean();

  const day30Retention = usersCreated30DaysAgo.length > 0
    ? (usersCreated30DaysAgo.filter(u => u.lastActiveAt && u.lastActiveAt >= oneMonthAgo).length / usersCreated30DaysAgo.length) * 100
    : 0;

  const totalUsers = await User.countDocuments();
  const premiumUsers = await User.countDocuments({ isPremium: true });
  const premiumConversionRate = totalUsers > 0
    ? Math.round((premiumUsers / totalUsers) * 1000) / 10
    : 0;

  return {
    dailyActiveUsers,
    weeklyActiveUsers,
    monthlyActiveUsers,
    retentionRates: {
      day30: Math.round(day30Retention * 10) / 10
    },
    premiumConversionRate
  };
}

/**
 * Get filtered list of users with pagination
 */
export async function getFilteredUsers(filters: any = {}, pagination: any = {}) {
  const {
    gender,
    minAge,
    maxAge,
    country,
    city,
    isPremium,
    verified,
    education,
    englishAbility,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const {
    page = 1,
    limit = 50
  } = pagination;

  const query: any = {};

  // Apply filters
  if (gender) query.gender = gender;
  if (isPremium !== undefined) query.isPremium = isPremium;
  if (verified !== undefined) query.verified = verified;
  if (education) query.education = education;
  if (englishAbility) query.englishAbility = englishAbility;
  if (country) query['location.country'] = country;
  if (city) query['location.city'] = city;

  // Search by username or email
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Age filtering (requires aggregation)
  let users;
  let total;

  if (minAge || maxAge) {
    const pipeline: any[] = [
      {
        $addFields: {
          age: {
            $dateDiff: {
              startDate: '$dateOfBirth',
              endDate: '$$NOW',
              unit: 'year'
            }
          }
        }
      }
    ];

    const ageFilter: any = {};
    if (minAge) ageFilter.$gte = minAge;
    if (maxAge) ageFilter.$lte = maxAge;

    if (minAge || maxAge) {
      pipeline.push({ $match: { age: ageFilter } });
    }

    // Apply other filters
    if (Object.keys(query).length > 0) {
      pipeline.push({ $match: query });
    }

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    total = countResult[0]?.total || 0;

    // Add sorting and pagination
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    pipeline.push(
      { $sort: sortObj },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    // Project safe fields (mask PII)
    pipeline.push({
      $project: {
        _id: 1,
        username: 1,
        email: 1, // Will be masked in formatting
        age: 1,
        gender: 1,
        location: {
          city: 1,
          country: 1
        },
        profilePhoto: 1,
        isPremium: 1,
        verified: 1,
        education: 1,
        englishAbility: 1,
        createdAt: 1,
        lastActiveAt: 1
      }
    });

    users = await User.aggregate(pipeline);
  } else {
    total = await User.countDocuments(query);

    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    users = await User.find(query)
      .select('username email dateOfBirth gender location profilePhoto isPremium verified education englishAbility createdAt lastActiveAt')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  // Format users with PII masking
  const formattedUsers = users.map(u => {
    const age = u.age || (u.dateOfBirth ? calculateAge(new Date(u.dateOfBirth)) : null);

    return {
      _id: u._id,
      username: u.username,
      email: maskEmail(u.email),
      age,
      gender: u.gender,
      location: {
        city: u.location?.city,
        country: u.location?.country
      },
      profilePhoto: u.profilePhoto,
      isPremium: u.isPremium,
      verified: u.verified,
      education: u.education,
      englishAbility: u.englishAbility,
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt
    };
  });

  return {
    users: formattedUsers,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  };
}
