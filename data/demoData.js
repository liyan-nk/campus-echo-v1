// data/demoData.js
// ─────────────────────────────────────────────────────────────────────────────
// Central in-memory store. Mirrors Firestore collections exactly.
// All service modules read/write here in DEMO_MODE.
// ─────────────────────────────────────────────────────────────────────────────

export const DS = {

  // ── users ─────────────────────────────────────────────────────────────────
  // status   : "pending" | "approved" | "rejected" | "banned"
  // frozenBy : null | uid  — if set, only that rank+ can unfreeze
  users: {
    "u-admin": {
      uid:"u-admin", name:"System Admin", email:"admin@campus.edu",
      role:"admin", status:"approved", verified:true,
      class:null, moderatesClass:null, assignedModeratorId:null,
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-9e7,
    },
    "u-faculty1": {
      uid:"u-faculty1", name:"Prof. Sarah Chen", email:"s.chen@campus.edu",
      role:"faculty", status:"approved", verified:true,
      class:null, moderatesClass:null, assignedModeratorId:null,
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-8e7,
    },
    "u-mod-s2cse": {
      uid:"u-mod-s2cse", name:"Riya Nair", email:"r.nair@campus.edu",
      role:"moderator", status:"approved", verified:true,
      class:"S2 CSE", moderatesClass:"S2 CSE", assignedModeratorId:null,
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-7e7,
    },
    "u-mod-s4cse": {
      uid:"u-mod-s4cse", name:"Arjun Menon", email:"a.menon@campus.edu",
      role:"moderator", status:"approved", verified:true,
      class:"S4 CSE", moderatesClass:"S4 CSE", assignedModeratorId:null,
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-7e7,
    },
    "u-mod-s6ece": {
      uid:"u-mod-s6ece", name:"Meera Pillai", email:"m.pillai@campus.edu",
      role:"moderator", status:"approved", verified:true,
      class:"S6 ECE", moderatesClass:"S6 ECE", assignedModeratorId:null,
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-7e7,
    },
    "u-student1": {
      uid:"u-student1", name:"Jamie Lee", email:"j.lee@campus.edu",
      role:"student", status:"approved", verified:false,
      class:"S4 CSE", moderatesClass:null, assignedModeratorId:"u-mod-s4cse",
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-4e7,
    },
    "u-student2": {
      uid:"u-student2", name:"Priya Sharma", email:"p.sharma@campus.edu",
      role:"student", status:"approved", verified:false,
      class:"S2 CSE", moderatesClass:null, assignedModeratorId:"u-mod-s2cse",
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-3e7,
    },
    "u-pending1": {
      uid:"u-pending1", name:"Rohit Das", email:"r.das@campus.edu",
      role:"student", status:"pending", verified:false,
      class:"S2 CSE", moderatesClass:null, assignedModeratorId:"u-mod-s2cse",
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-3600000,
    },
    "u-pending2": {
      uid:"u-pending2", name:"Anjali Krishnan", email:"a.krishnan@campus.edu",
      role:"student", status:"pending", verified:false,
      class:"S6 ECE", moderatesClass:null, assignedModeratorId:"u-mod-s6ece",
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-7200000,
    },
    "u-pending3": {
      uid:"u-pending3", name:"Kevin Thomas", email:"k.thomas@campus.edu",
      role:"student", status:"pending", verified:false,
      class:"S4 CSE", moderatesClass:null, assignedModeratorId:"u-mod-s4cse",
      bannedAt:null, bannedBy:null, banReason:null,
      createdAt: Date.now()-1800000,
    },
  },

  // ── posts ─────────────────────────────────────────────────────────────────
  // status   : "active" | "hidden" | "locked"
  // frozenBy : null | uid   — set when admin takes action; blocks mod override
  // deletedAt: null | ms    — soft-delete timestamp
  posts: {
    "p1": {
      id:"p1", title:"Welcome to Campus Echo!",
      content:"This is your anonymous discussion platform. Post freely, vote honestly, and keep it civil. Faculty and moderators are here to help navigate campus life.",
      category:"general", userId:"u-faculty1", userRole:"faculty",
      votes:43, commentCount:3, status:"active", frozenBy:null,
      deletedAt:null, createdAt: Date.now()-7e7,
    },
    "p2": {
      id:"p2", title:"Final exam schedule released — anyone else concerned?",
      content:"Has anyone seen the updated final exam schedule? The CS department moved everything to the last week which overlaps with multiple other departments. This seems really poorly coordinated and is going to cause a lot of stress.",
      category:"academics", userId:"u-student1", userRole:"student",
      votes:32, commentCount:5, status:"active", frozenBy:null,
      deletedAt:null, createdAt: Date.now()-3e7,
    },
    "p3": {
      id:"p3", title:"Cafeteria food quality has dropped significantly",
      content:"The food quality has been declining for months. Portion sizes are smaller, options are repetitive, and prices went up. Can we start a student petition?",
      category:"campus-life", userId:"u-student2", userRole:"student",
      votes:19, commentCount:2, status:"active", frozenBy:null,
      deletedAt:null, createdAt: Date.now()-1.5e7,
    },
    "p4": {
      id:"p4", title:"Study group for Algorithms midterm this Friday",
      content:"Looking to form a study group for CS 301 Algorithms midterm. Meeting in library room B204 at 6pm. All welcome — bring notes!",
      category:"academics", userId:"u-student1", userRole:"student",
      votes:10, commentCount:0, status:"active", frozenBy:null,
      deletedAt:null, createdAt: Date.now()-5e6,
    },
    "p5": {
      id:"p5", title:"Library booking system is broken again",
      content:"The online room booking system has been down for three days. Has anyone found a workaround? The library staff just say 'we know about it' but nothing gets fixed.",
      category:"campus-life", userId:"u-student2", userRole:"student",
      votes:24, commentCount:1, status:"locked", frozenBy:"u-admin",
      deletedAt:null, createdAt: Date.now()-2e6,
    },
  },

  // ── comments ─────────────────────────────────────────────────────────────
  // deletedAt: null | ms  — soft delete; content replaced with [Deleted by User]
  // frozenBy : null | uid
  comments: {
    "c1":{ id:"c1", postId:"p1", userId:"u-admin",    userRole:"admin",   content:"Welcome everyone! Campus Echo is a space for open, respectful dialogue.", votes:10, parentId:null, deletedAt:null, frozenBy:null, createdAt:Date.now()-6.5e7 },
    "c2":{ id:"c2", postId:"p1", userId:"u-faculty1", userRole:"faculty", content:"As faculty I am committed to monitoring this space and responding to academic concerns promptly.", votes:15, parentId:null, deletedAt:null, frozenBy:null, createdAt:Date.now()-6e7 },
    "c3":{ id:"c3", postId:"p1", userId:"u-student1", userRole:"student", content:"Really appreciate this initiative. Finally a space to discuss things openly.", votes:7, parentId:"c2", deletedAt:null, frozenBy:null, createdAt:Date.now()-5.5e7 },
    "c4":{ id:"c4", postId:"p2", userId:"u-faculty1", userRole:"faculty", content:"I've raised this scheduling conflict with the department chair. We're actively working on a resolution.", votes:22, parentId:null, deletedAt:null, frozenBy:null, createdAt:Date.now()-2.5e7 },
    "c5":{ id:"c5", postId:"p2", userId:"u-student1", userRole:"student", content:"Thank you Professor Chen! Really appreciate you taking action so quickly.", votes:8, parentId:"c4", deletedAt:null, frozenBy:null, createdAt:Date.now()-2e7 },
    "c6":{ id:"c6", postId:"p5", userId:"u-student2", userRole:"student", content:"Same issue! I had to physically go and ask in person.", votes:5, parentId:null, deletedAt:null, frozenBy:null, createdAt:Date.now()-1.5e6 },
  },

  // ── votes ─────────────────────────────────────────────────────────────────
  votes: {},

  // ── reports ───────────────────────────────────────────────────────────────
  // resolved: false | "deleted" | "dismissed"
  reports: {
    "r1":{ id:"r1", targetId:"p3", targetType:"post", reason:"Misleading information about cafeteria quality.", reporterId:"u-student1", resolved:false, createdAt:Date.now()-1e7 },
    "r2":{ id:"r2", targetId:"c3", targetType:"comment", reason:"This comment seems off-topic.", reporterId:"u-student2", resolved:false, createdAt:Date.now()-5e6 },
  },

  // ── notifications ─────────────────────────────────────────────────────────
  // type: "approval" | "rejection" | "reply" | "locked" | "hidden" | "banned"
  notifications: {
    "n1":{ id:"n1", userId:"u-student1", type:"reply", message:"Someone replied to your comment on 'Welcome to Campus Echo!'", postId:"p1", read:false, createdAt:Date.now()-5.4e7 },
    "n2":{ id:"n2", userId:"u-student2", type:"locked", message:"A post you commented on has been locked by a moderator.", postId:"p5", read:false, createdAt:Date.now()-1.8e6 },
  },

  _seq: 400,
};

export const AVAILABLE_CLASSES = [
  "S1 CSE","S2 CSE","S3 CSE","S4 CSE","S5 CSE","S6 CSE",
  "S1 ECE","S2 ECE","S3 ECE","S4 ECE","S5 ECE","S6 ECE",
  "S1 ME", "S2 ME", "S3 ME", "S4 ME", "S5 ME", "S6 ME",
  "S1 CE", "S2 CE", "S3 CE", "S4 CE", "S5 CE", "S6 CE",
];

export const CATEGORIES = [
  "general","academics","campus-life","events","housing","sports","other",
];

export const nextId = () => "x" + (++DS._seq);

export const roleRank = { student:0, faculty:1, moderator:2, admin:3 };

// Returns true if actorRole outranks targetRole
export const outranks = (actorRole, targetRole) =>
  (roleRank[actorRole] ?? 0) > (roleRank[targetRole] ?? 0);
