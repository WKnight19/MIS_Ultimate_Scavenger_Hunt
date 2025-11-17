const root = document.documentElement;
const viewContainer = document.getElementById("viewContainer");
const navLinks = document.querySelectorAll(".nav-link");
const sidebar = document.getElementById("appSidebar");
const collapseSidebarBtn = document.getElementById("collapseSidebar");
const mobileNavToggle = document.getElementById("mobileNavToggle");
const themeToggle = document.getElementById("themeToggle");
const userBadge = document.getElementById("userBadge");
const signOutBtn = document.getElementById("signOutBtn");
const roleAwareNodes = document.querySelectorAll("[data-roles]");

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const storedTheme = localStorage.getItem("mis-theme");
const initialTheme = storedTheme || (prefersDark ? "dark" : "light");

const mockUsers = {
  student: {
    role: "student",
    name: "Jamie Alvarez",
    email: "student@ua.edu",
    password: "student123",
    team: "Team Crimson",
    stats: {
      rank: "#12 Overall",
      points: "2,450 pts",
      tasks: "47",
      streak: "12 days",
    },
    profile: { points: 2450, hunts: 6, badges: 9, messages: 38 },
    timeline: [
      {
        label: "Submitted “Data Insights”",
        meta: "Today · 3:05 PM",
        status: "success",
      },
      {
        label: "Revision requested – “Cyber Lab”",
        meta: "Yesterday · 9:12 PM",
        status: "warn",
      },
      {
        label: "Joined Team Crimson",
        meta: "Mon · 11:00 AM",
        status: "neutral",
      },
    ],
  },
  ta: {
    role: "ta",
    name: "Marta Rivers",
    email: "ta@ua.edu",
    password: "ta123",
    team: "Instruction Team",
    adminStats: { cohorts: 2, hunts: 5, reviews: 32, alerts: 1 },
  },
  admin: {
    role: "admin",
    name: "Dr. Reed",
    email: "admin@ua.edu",
    password: "admin!2024",
    team: "MIS Leadership",
    adminStats: { cohorts: 3, hunts: 8, reviews: 48, alerts: 2 },
  },
};

const peerProfiles = {
  avery: {
    name: "Avery Chen",
    role: "Student · Team Crimson",
    stats: { points: 3210, tasks: 58, badges: 12 },
    highlights: [
      "Completed all Cybersecurity checkpoints",
      "Submitted bonus research note",
    ],
  },
  jordan: {
    name: "Jordan Patel",
    role: "Student · Team Silver",
    stats: { points: 3045, tasks: 54, badges: 10 },
    highlights: ["Won Innovation Sprint", "Hosted peer workshop"],
  },
  sam: {
    name: "Sam Hart",
    role: "Student · Team Silver",
    stats: { points: 2980, tasks: 52, badges: 9 },
    highlights: ["Fastest scavenger completion this week"],
  },
};

const hunts = {
  innovation: {
    title: "Innovation Sprint",
    summary:
      "Collaborative hunt focused on rapid ideation across campus hotspots.",
    reward: "250 pts + badge",
    duration: "5 days",
    mode: "Hybrid",
    enrolled: "72 students",
    milestones: [
      "Pitch concept at Ferguson Center",
      "Document user interviews",
      "Submit final prototype summary",
    ],
    tasks: [
      { name: "Customer interviews", points: 80, status: "In progress" },
      { name: "Prototype upload", points: 120, status: "Not started" },
      { name: "Reflection video", points: 50, status: "Locked" },
    ],
  },
  cyber: {
    title: "Cybersecurity Challenge",
    summary:
      "Hands-on hunt where teams secure virtual systems across campus labs.",
    reward: "300 pts",
    duration: "1 week",
    mode: "On Campus",
    enrolled: "48 students",
    milestones: [
      "Lab orientation",
      "Threat hunt exercise",
      "Final debrief submission",
    ],
    tasks: [
      { name: "Vulnerability scan", points: 90, status: "Pending review" },
      { name: "Incident report", points: 110, status: "Not started" },
      { name: "Team retrospective", points: 60, status: "Not started" },
    ],
  },
  community: {
    title: "Community Builder",
    summary: "Ongoing hunt that pairs MIS students with local organizations.",
    reward: "150 pts",
    duration: "Ongoing",
    mode: "Remote",
    enrolled: "110 students",
    milestones: [
      "Match with org partner",
      "Deliver weekly update",
      "Publish recap",
    ],
    tasks: [
      { name: "Partner kickoff", points: 40, status: "Complete" },
      { name: "Midpoint check-in", points: 55, status: "In progress" },
      { name: "Impact summary", points: 55, status: "Not started" },
    ],
  },
};

const authState = {
  role: "guest",
  user: null,
  isAuthenticated: false,
};

const roleHomeRoute = {
  guest: "landing",
  student: "student-dashboard",
  ta: "instructor-dashboard",
  admin: "admin",
};

root.dataset.theme = initialTheme;
updateThemeLabel(initialTheme);
updateRoleVisibility();
updateSidebarState();
initializeNavigation();
initializeTabs();
initializeDrawers();
initializeForms();
initializeHuntButtons();
initializePeerButtons();
initializeMiscRouteButtons();
initializeScrollButtons();
initializeLoginJumpers();
handleHashRoute();
window.addEventListener("hashchange", handleHashRoute);

function initializeNavigation() {
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.dataset.route;
      activateNav(link);
      showView(target);
      if (window.innerWidth <= 1024) {
        sidebar.classList.remove("open");
      }
    });
  });

  collapseSidebarBtn?.addEventListener("click", () => {
    if (!authState.isAuthenticated) {
      showToast("Sign in to open the navigation.");
      return;
    }
    sidebar.classList.toggle("collapsed");
    updateSidebarToggleLabel();
  });

  mobileNavToggle?.addEventListener("click", () => {
    if (!authState.isAuthenticated) {
      showToast("Sign in to open the navigation.");
      return;
    }
    sidebar.classList.toggle("open");
  });

  themeToggle?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    localStorage.setItem("mis-theme", nextTheme);
    updateThemeLabel(nextTheme);
  });

  signOutBtn?.addEventListener("click", () => {
    resetAuthState();
    showToast("You are signed out.");
  });
}

function initializeTabs() {
  document.querySelectorAll(".tabs").forEach((tabGroup) => {
    tabGroup.addEventListener("click", (event) => {
      const button = event.target.closest(".tab");
      if (!button) return;
      const targetId = button.dataset.tab;
      const parent = tabGroup.parentElement;
      tabGroup
        .querySelectorAll(".tab")
        .forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      parent.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === targetId);
      });
    });
  });
}

function initializeDrawers() {
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => openDrawer(button.dataset.open));
  });
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => closeDrawer(button.dataset.close));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".drawer.open").forEach((drawer) => {
        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
      });
    }
  });
}

function initializeForms() {
  const studentLoginForm = document.getElementById("studentLogin");
  const adminLoginForm = document.getElementById("adminLogin");

  studentLoginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const [emailInput, passwordInput] =
      studentLoginForm.querySelectorAll("input");
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    const user = Object.values(mockUsers).find(
      (candidate) =>
        candidate.email === email &&
        candidate.password === password &&
        candidate.role !== "admin"
    );
    if (!user) {
      showToast("Invalid student/TA credentials.");
      return;
    }
    setAuthState(user);
  });

  adminLoginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const [emailInput, codeInput] = adminLoginForm.querySelectorAll("input");
    const email = emailInput.value.trim().toLowerCase();
    const code = codeInput.value.trim();
    const adminUser =
      mockUsers.admin.email === email && mockUsers.admin.password === code
        ? mockUsers.admin
        : null;
    if (!adminUser) {
      showToast("Invalid admin access code.");
      return;
    }
    setAuthState(adminUser);
  });

  document.querySelectorAll("form").forEach((form) => {
    if (form.id === "studentLogin" || form.id === "adminLogin") return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showToast("Demo only: submission captured.");
    });
  });
}

function initializeHuntButtons() {
  document.querySelectorAll("[data-hunt]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!authState.isAuthenticated) {
        showToast("Sign in to explore hunts.");
        showView("auth");
        return;
      }
      loadHuntDetail(button.dataset.hunt);
    });
  });
}

function initializePeerButtons() {
  document.querySelectorAll("[data-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!authState.isAuthenticated) {
        showToast("Sign in to view profiles.");
        showView("auth");
        return;
      }
      openPeerProfile(button.dataset.profile);
    });
  });
}

function initializeMiscRouteButtons() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-route]");
    if (!target || target.classList.contains("nav-link")) return;
    const route = target.dataset.route;
    if (route) {
      event.preventDefault();
      showView(route);
    }
  });
}

function initializeScrollButtons() {
  document.querySelectorAll("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const selector = btn.dataset.scroll;
      if (!selector) return;
      const view = document.querySelector(selector);
      if (view && view.classList.contains("view")) {
        event.preventDefault();
        showView(view.id);
      } else {
        document
          .querySelector(selector)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function initializeLoginJumpers() {
  document.querySelectorAll("[data-login-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.loginTab;
      showView("auth");
      activateLoginTab(tabId);
    });
  });
}

function activateLoginTab(targetId) {
  const tabGroup = document.querySelector("#auth .tabs");
  if (!tabGroup) return;
  const tabButton = tabGroup.querySelector(`.tab[data-tab="${targetId}"]`);
  if (!tabButton) return;
  tabGroup
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("active"));
  tabButton.classList.add("active");
  document
    .querySelectorAll("#auth .tab-panel")
    .forEach((panel) =>
      panel.classList.toggle("active", panel.id === targetId)
    );
}

function setAuthState(user) {
  authState.user = user;
  authState.role = user.role;
  authState.isAuthenticated = true;
  updateRoleVisibility();
  updateSidebarState();
  updateUserBadge();
  updateDashboards();
  const homeRoute = roleHomeRoute[user.role] || "landing";
  highlightNavByRoute(homeRoute);
  showView(homeRoute);
  showToast(`Welcome back, ${user.name}!`);
}

function resetAuthState() {
  authState.user = null;
  authState.role = "guest";
  authState.isAuthenticated = false;
  updateRoleVisibility();
  updateSidebarState();
  updateUserBadge();
  highlightNavByRoute("landing");
  showView("landing");
}

function updateUserBadge() {
  if (!userBadge) return;
  if (!authState.isAuthenticated || !authState.user) {
    userBadge.textContent = "Signed out";
    return;
  }
  const roleLabel =
    authState.role === "ta"
      ? "TA"
      : authState.role.charAt(0).toUpperCase() + authState.role.slice(1);
  userBadge.textContent = `${authState.user.name} · ${roleLabel}`;
}

function updateDashboards() {
  if (!authState.user) return;
  if (authState.role === "student") {
    updateStudentWidgets(authState.user);
  }
  if (authState.role === "ta" || authState.role === "admin") {
    updateAdminWidgets(authState.user);
  }
}

function updateStudentWidgets(user) {
  const rankEl = document.getElementById("studentRank");
  const pointsEl = document.getElementById("studentPoints");
  const tasksEl = document.getElementById("studentTasks");
  const streakEl = document.getElementById("studentStreak");
  const profileName = document.getElementById("profileName");
  const profileMeta = document.getElementById("profileMeta");
  const profilePoints = document.getElementById("profilePoints");
  const profileHunts = document.getElementById("profileHunts");
  const profileBadges = document.getElementById("profileBadges");
  const profileMessages = document.getElementById("profileMessages");
  const timeline = document.getElementById("profileTimeline");

  if (rankEl) rankEl.textContent = user.stats.rank;
  if (pointsEl) pointsEl.textContent = user.stats.points;
  if (tasksEl) tasksEl.textContent = user.stats.tasks;
  if (streakEl) streakEl.textContent = user.stats.streak;
  if (profileName) profileName.textContent = user.name;
  if (profileMeta) profileMeta.textContent = `Student · ${user.team}`;
  if (profilePoints)
    profilePoints.textContent = user.profile.points.toLocaleString();
  if (profileHunts) profileHunts.textContent = user.profile.hunts;
  if (profileBadges) profileBadges.textContent = user.profile.badges;
  if (profileMessages) profileMessages.textContent = user.profile.messages;
  if (timeline) {
    timeline.innerHTML = user.timeline
      .map(
        (item) => `
        <li>
          <span class="badge ${item.status}">•</span>
          <div>
            <p>${item.label}</p>
            <p class="muted">${item.meta}</p>
          </div>
        </li>`
      )
      .join("");
  }
}

function updateAdminWidgets(user) {
  const profileName = document.getElementById("adminProfileName");
  const profileMeta = document.getElementById("adminProfileMeta");
  const cohortsEl = document.getElementById("adminProfileCohorts");
  const huntsEl = document.getElementById("adminProfileHunts");
  const reviewsEl = document.getElementById("adminProfileReviews");
  const alertsEl = document.getElementById("adminProfileAlerts");
  const responsibilities = document.getElementById("adminResponsibilities");

  if (!user.adminStats) return;

  if (profileName) profileName.textContent = user.name;
  if (profileMeta)
    profileMeta.textContent = `${user.role === "ta" ? "TA" : "Program Admin"}`;
  if (cohortsEl) cohortsEl.textContent = user.adminStats.cohorts;
  if (huntsEl) huntsEl.textContent = user.adminStats.hunts;
  if (reviewsEl) reviewsEl.textContent = user.adminStats.reviews;
  if (alertsEl) alertsEl.textContent = user.adminStats.alerts;
  if (responsibilities && user.role === "ta") {
    responsibilities.innerHTML = `
      <li><p>Coach teams weekly</p><span class="badge success">Active</span></li>
      <li><p>Review submissions</p><span class="badge warn">High</span></li>
    `;
  }
}

function loadHuntDetail(huntId) {
  const hunt = hunts[huntId];
  if (!hunt) {
    showToast("Hunt not found.");
    return;
  }
  const titleEl = document.getElementById("huntDetailTitle");
  const metaEl = document.getElementById("huntDetailMeta");
  const summaryEl = document.getElementById("huntDetailSummary");
  const statsEl = document.getElementById("huntDetailStats");
  const milestonesEl = document.getElementById("huntMilestones");
  const tasksTable = document
    .getElementById("huntTasksTable")
    ?.querySelector("tbody");

  if (titleEl) titleEl.textContent = hunt.title;
  if (metaEl) metaEl.textContent = `${hunt.duration} · ${hunt.mode}`;
  if (summaryEl) summaryEl.textContent = hunt.summary;
  if (statsEl) {
    statsEl.innerHTML = `
      <div><dt>Reward</dt><dd>${hunt.reward}</dd></div>
      <div><dt>Duration</dt><dd>${hunt.duration}</dd></div>
      <div><dt>Mode</dt><dd>${hunt.mode}</dd></div>
      <div><dt>Enrolled</dt><dd>${hunt.enrolled}</dd></div>
    `;
  }
  if (milestonesEl) {
    milestonesEl.innerHTML = hunt.milestones
      .map(
        (item) => `
        <li>
          <span class="badge neutral">•</span>
          <div><p>${item}</p></div>
        </li>`
      )
      .join("");
  }
  if (tasksTable) {
    tasksTable.innerHTML = hunt.tasks
      .map(
        (task) => `
        <tr>
          <td>${task.name}</td>
          <td>${task.points}</td>
          <td>${task.status}</td>
        </tr>`
      )
      .join("");
  }
  highlightNavByRoute("hunt-detail");
  showView("hunt-detail");
}

function openPeerProfile(profileId) {
  const profile = peerProfiles[profileId];
  if (!profile) {
    showToast("No profile found.");
    return;
  }
  const nameEl = document.getElementById("peerProfileName");
  const metaEl = document.getElementById("peerProfileMeta");
  const statsEl = document.getElementById("peerProfileStats");
  const highlightsEl = document.getElementById("peerHighlights");

  if (nameEl) nameEl.textContent = profile.name;
  if (metaEl) metaEl.textContent = profile.role;
  if (statsEl) {
    statsEl.innerHTML = `
      <article><p class="muted">Points</p><h4>${profile.stats.points}</h4></article>
      <article><p class="muted">Tasks</p><h4>${profile.stats.tasks}</h4></article>
      <article><p class="muted">Badges</p><h4>${profile.stats.badges}</h4></article>
    `;
  }
  if (highlightsEl) {
    highlightsEl.innerHTML = profile.highlights
      .map(
        (item) => `
        <li>
          <p>${item}</p>
        </li>`
      )
      .join("");
  }
  highlightNavByRoute("peer-profile");
  showView("peer-profile");
}

function updateRoleVisibility() {
  roleAwareNodes.forEach((node) => {
    const roles = parseRoles(node.dataset.roles);
    const shouldShow = roles.includes(authState.role);
    node.classList.toggle("is-hidden", !shouldShow);
  });
}

function parseRoles(attr) {
  if (!attr) return ["guest", "student", "ta", "admin"];
  return attr.split(",").map((role) => role.trim());
}

function updateSidebarState() {
  const shouldLock = !authState.isAuthenticated;
  sidebar.classList.toggle("sidebar--locked", shouldLock);
  if (shouldLock) {
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
  }
  collapseSidebarBtn.disabled = shouldLock;
  updateSidebarToggleLabel();
}

function updateSidebarToggleLabel() {
  if (!collapseSidebarBtn) return;
  const collapsed = sidebar.classList.contains("collapsed");
  collapseSidebarBtn.textContent = collapsed
    ? "Expand Sidebar"
    : "Collapse Sidebar";
  collapseSidebarBtn.setAttribute("aria-expanded", String(!collapsed));
}

function activateNav(activeLink) {
  navLinks.forEach((link) => link.classList.remove("active"));
  activeLink.classList.add("active");
}

function highlightNavByRoute(route) {
  const match = Array.from(navLinks).find(
    (link) => link.dataset.route === route
  );
  if (match) activateNav(match);
}

function showView(id, options = {}) {
  const { updateHash = true, scroll = true } = options;
  const view = document.getElementById(id);
  if (!view) {
    showToast("Page unavailable.");
    return false;
  }
  const allowedRoles = parseRoles(view.dataset.roles);
  if (!allowedRoles.includes(authState.role)) {
    if (!authState.isAuthenticated) {
      showToast("Please sign in to access this page.");
      highlightNavByRoute("auth");
      showView("auth", { updateHash: true, scroll: true });
    } else {
      showToast("You do not have permission to view that page.");
      const fallback = roleHomeRoute[authState.role] || "landing";
      highlightNavByRoute(fallback);
      showView(fallback, { updateHash: true, scroll: true });
    }
    return false;
  }
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === id);
  });
  highlightNavByRoute(id);
  if (updateHash) {
    const hash = `#${id}`;
    if (window.location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
  }
  if (scroll) {
    view.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return true;
}

function getRouteFromHash() {
  return window.location.hash.replace("#", "") || "landing";
}

function handleHashRoute() {
  const route = getRouteFromHash();
  const handled = showView(route, { updateHash: false });
  if (!handled && route !== "landing") {
    showView("landing", { updateHash: false });
  }
}

function openDrawer(id) {
  const drawer = document.getElementById(id);
  drawer?.classList.add("open");
  drawer?.setAttribute("aria-hidden", "false");
}

function closeDrawer(id) {
  const drawer = document.getElementById(id);
  drawer?.classList.remove("open");
  drawer?.setAttribute("aria-hidden", "true");
}

let toastTimeout;
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  updateThemeLabel(initialTheme);
});
