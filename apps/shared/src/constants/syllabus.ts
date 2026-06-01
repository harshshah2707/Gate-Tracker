export interface Topic {
  id: string;
  name: string;
  subtopics?: string[];
}

export interface Unit {
  id: string;
  name: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  units: Unit[];
}

export const GATE_CSE_SYLLABUS: Subject[] = [
  {
    id: "maths",
    name: "Engineering Mathematics",
    units: [
      {
        id: "maths-linear-algebra",
        name: "Linear Algebra",
        topics: [
          { id: "matrices", name: "Matrices and Determinants", subtopics: ["System of linear equations", "Eigenvalues and eigenvectors", "LU decomposition"] }
        ]
      },
      {
        id: "maths-calculus",
        name: "Calculus",
        topics: [
          { id: "calculus-limits", name: "Limits, Continuity and Differentiability", subtopics: ["Mean value theorems", "Theorems of integral calculus"] },
          { id: "calculus-multivariable", name: "Partial Derivatives and Integration", subtopics: ["Evaluation of definite and improper integrals", "Partial derivatives", "Total derivative", "Maxima and minima", "Fourier series", "Vector identities", "Directional derivatives", "Line, Surface and Volume integrals", "Stokes, Gauss and Green's theorems"] }
        ]
      },
      {
        id: "maths-probability",
        name: "Probability and Statistics",
        topics: [
          { id: "prob-basics", name: "Random Variables and Probability", subtopics: ["Conditional probability", "Mean, median, mode and standard deviation", "Bayes theorem"] },
          { id: "prob-dist", name: "Probability Distributions", subtopics: ["Uniform, normal, exponential, poisson and binomial distributions"] }
        ]
      }
    ]
  },
  {
    id: "discrete-maths",
    name: "Discrete Mathematics",
    units: [
      {
        id: "dm-logic",
        name: "Mathematical Logic",
        topics: [
          { id: "logic-prop", name: "Propositional and First-Order Logic", subtopics: ["Propositional logic", "Predicate logic", "Rules of inference", "Satisfiability"] }
        ]
      },
      {
        id: "dm-sets-relations",
        name: "Sets, Relations & Combinatorics",
        topics: [
          { id: "sets-relations", name: "Sets, Relations, Functions & Partial Orders", subtopics: ["Equivalence relations", "Partial orders", "Lattices", "Hasse diagrams", "Functions"] },
          { id: "combinatorics", name: "Combinatorics and Recurrence Relations", subtopics: ["Counting techniques", "Generating functions", "Recurrence relations", "Pigeonhole principle"] }
        ]
      },
      {
        id: "dm-groups",
        name: "Group Theory",
        topics: [
          { id: "group-theory", name: "Groups, Monoids and Semigroups", subtopics: ["Subgroups", "Cosets", "Lagrange theorem", "Isomorphism"] }
        ]
      },
      {
        id: "dm-graphs",
        name: "Graph Theory",
        topics: [
          { id: "graphs-basics", name: "Connectivity, Matching and Coloring", subtopics: ["Eulerian and Hamiltonian paths", "Planar graphs", "Graph coloring", "Matching", "Trees"] }
        ]
      }
    ]
  },
  {
    id: "digital-logic",
    name: "Digital Logic",
    units: [
      {
        id: "dl-circuits",
        name: "Digital Circuits",
        topics: [
          { id: "boolean-algebra", name: "Boolean Algebra and Minimization", subtopics: ["K-Maps", "SOP and POS forms", "Logic gates"] },
          { id: "combinational", name: "Combinational Circuits", subtopics: ["Multiplexers", "Decoders", "Adders", "Subtractors", "Code converters"] },
          { id: "sequential", name: "Sequential Circuits", subtopics: ["Latches and Flip-Flops", "Counters", "Shift registers", "State machines"] }
        ]
      },
      {
        id: "dl-arithmetic",
        name: "Computer Arithmetic",
        topics: [
          { id: "number-systems", name: "Number Representations and Fixed/Floating Point", subtopics: ["Signed number representation", "IEEE 754 floating point format", "Precision"] }
        ]
      }
    ]
  },
  {
    id: "coa",
    name: "Computer Organization and Architecture",
    units: [
      {
        id: "coa-cpu",
        name: "Central Processing Unit",
        topics: [
          { id: "instructions-modes", name: "Machine Instructions and Addressing Modes", subtopics: ["Instruction formats", "Addressing modes (direct, indirect, indexed, etc.)"] },
          { id: "alu-datapath", name: "ALU, Data-Path and Control Unit", subtopics: ["Hardwired control", "Microprogrammed control", "ALU design"] }
        ]
      },
      {
        id: "coa-pipeline",
        name: "Pipelining",
        topics: [
          { id: "pipelining", name: "Instruction Pipelining and Hazards", subtopics: ["Structural hazards", "Data hazards", "Control hazards", "Pipeline performance metrics"] }
        ]
      },
      {
        id: "coa-memory",
        name: "Memory Hierarchy & I/O",
        topics: [
          { id: "memory-hierarchy", name: "Memory Hierarchy: Cache, Main, and Secondary", subtopics: ["Cache mapping (direct, associative, set-associative)", "Cache write policies", "Virtual memory mapping"] },
          { id: "io-interfaces", name: "I/O Interface: Interrupts and DMA", subtopics: ["Programmed I/O", "Interrupt-driven I/O", "DMA transfer mode"] }
        ]
      }
    ]
  },
  {
    id: "programming-ds",
    name: "Programming and Data Structures",
    units: [
      {
        id: "pds-c",
        name: "Programming in C",
        topics: [
          { id: "c-programming", name: "C Language Syntax, Pointers, and Recursion", subtopics: ["Pointers and arrays", "Parameter passing", "Scope", "Recursion functions"] }
        ]
      },
      {
        id: "pds-ds",
        name: "Data Structures",
        topics: [
          { id: "linear-ds", name: "Stacks, Queues, and Linked Lists", subtopics: ["Singly and doubly linked lists", "Stack applications", "Circular queues"] },
          { id: "trees-heaps", name: "Trees, BSTs, and Binary Heaps", subtopics: ["Tree traversals", "Binary search trees insertion/deletion", "Min/Max heaps properties", "Priority queues"] },
          { id: "graph-repr", name: "Graph Representations", subtopics: ["Adjacency matrix", "Adjacency list"] }
        ]
      }
    ]
  },
  {
    id: "algorithms",
    name: "Algorithms",
    units: [
      {
        id: "algo-basics",
        name: "Analysis and Sorting",
        topics: [
          { id: "complexity", name: "Asymptotic Complexity & Recursion Tree", subtopics: ["Time and space complexity", "Big-O notation", "Master theorem", "Recurrence equations"] },
          { id: "searching-sorting", name: "Searching, Sorting and Hashing", subtopics: ["Quick sort, merge sort, heap sort", "Binary search", "Hash functions and collision resolution"] }
        ]
      },
      {
        id: "algo-design",
        name: "Algorithm Design Techniques",
        topics: [
          { id: "design-techniques", name: "Greedy, Dynamic Programming & Divide-and-Conquer", subtopics: ["Knapsack problem", "Matrix chain multiplication", "Longest common subsequence", "Optimal binary search trees"] }
        ]
      },
      {
        id: "algo-graphs",
        name: "Graph Algorithms",
        topics: [
          { id: "graph-algos", name: "Spanning Trees, Shortest Paths and Traversals", subtopics: ["BFS and DFS", "Kruskal's and Prim's MST algorithms", "Dijkstra's, Bellman-Ford, and Floyd-Warshall shortest path"] }
        ]
      }
    ]
  },
  {
    id: "toc",
    name: "Theory of Computation",
    units: [
      {
        id: "toc-languages",
        name: "Automata and Languages",
        topics: [
          { id: "finite-automata", name: "Regular Expressions and Finite Automata", subtopics: ["DFA and NFA minimization", "Regular expressions equivalence", "Pumping Lemma for regular languages"] },
          { id: "cfg-pda", name: "Context-Free Grammars and PDA", subtopics: ["Ambiguity in CFGs", "Deterministic and non-deterministic PDAs", "Pumping Lemma for CFLs"] },
          { id: "turing-undecidability", name: "Turing Machines and Undecidability", subtopics: ["Halting problem", "Decidability", "Recursive and recursively enumerable languages", "Rice's Theorem"] }
        ]
      }
    ]
  },
  {
    id: "compiler",
    name: "Compiler Design",
    units: [
      {
        id: "compiler-phases",
        name: "Compiler Phases",
        topics: [
          { id: "lexical-parse", name: "Lexical Analysis and Parsing", subtopics: ["LL(1) parsing", "LR, SLR, LALR, CLR parsing", "Operator precedence", "Lexical tokens"] },
          { id: "sdt", name: "Syntax-Directed Translation & Semantics", subtopics: ["S-attributed and L-attributed definitions", "Type checking"] },
          { id: "runtime-intermediate", name: "Runtime Environments & Intermediate Code", subtopics: ["Activation records", "Three-address code", "Static single assignment (SSA)"] },
          { id: "optimization", name: "Code Optimization and Analysis", subtopics: ["Liveness analysis", "Constant propagation", "Common subexpression elimination", "Loop optimization"] }
        ]
      }
    ]
  },
  {
    id: "os",
    name: "Operating Systems",
    units: [
      {
        id: "os-processes",
        name: "Process Management",
        topics: [
          { id: "cpu-scheduling", name: "Processes, Threads, and CPU Scheduling", subtopics: ["Context switching", "FCFS, SJF, Round Robin, Priority scheduling", "Multi-threading model"] },
          { id: "concurrency-sync", name: "Concurrency, Sync, and Deadlocks", subtopics: ["Semaphores", "Mutexes", "Classical synchronization problems (Dining Philosophers, Producer-Consumer)", "Deadlock detection, prevention, and avoidance (Banker's algorithm)"] }
        ]
      },
      {
        id: "os-memory",
        name: "Memory & File Systems",
        topics: [
          { id: "memory-mgmt", name: "Memory Management and Virtual Memory", subtopics: ["Paging and Segmentation", "Page replacement algorithms (FIFO, LRU, Optimal)", "Thrashing"] },
          { id: "file-systems", name: "File Systems and Disk Scheduling", subtopics: ["Directory structures", "File allocation methods", "FCFS, SSTF, SCAN, C-SCAN disk scheduling"] }
        ]
      }
    ]
  },
  {
    id: "dbms",
    name: "Databases",
    units: [
      {
        id: "db-design",
        name: "Database Design & SQL",
        topics: [
          { id: "er-relational", name: "ER-Model, Relational Algebra, and SQL", subtopics: ["ER diagram mappings", "Relational algebra operators", "SQL queries (joins, subqueries, aggregations)", "Tuple relational calculus"] },
          { id: "normalization", name: "Integrity Constraints and Normal Forms", subtopics: ["Functional dependencies", "1NF, 2NF, 3NF, BCNF, 4NF decomposition", "Lossless join", "Dependency preservation"] }
        ]
      },
      {
        id: "db-transactions",
        name: "Transactions & File Storage",
        topics: [
          { id: "indexing", name: "File Organization and Indexing", subtopics: ["B and B+ trees properties", "Dense and sparse indexing"] },
          { id: "concurrency-control", name: "Transactions and Concurrency Control", subtopics: ["ACID properties", "Serializability (conflict and view)", "Two-phase locking (2PL)", "Timestamp ordering"] }
        ]
      }
    ]
  },
  {
    id: "networks",
    name: "Computer Networks",
    units: [
      {
        id: "cn-layers",
        name: "Network Layers & Protocols",
        topics: [
          { id: "layering-basics", name: "OSI and TCP/IP Protocol Stacks", subtopics: ["Layer functions", "Packet vs circuit switching"] },
          { id: "data-link", name: "Data Link Layer: MAC, Framing & Bridging", subtopics: ["Sliding window protocols", "CSMA/CD and CSMA/CA", "Error detection (CRC)", "Ethernet bridging"] },
          { id: "network-layer", name: "Routing, IP Addressing, CIDR & Protocols", subtopics: ["IPv4, IPv6, CIDR subnets", "Routing: Link-state vs Distance-vector", "ARP, DHCP, ICMP, NAT"] },
          { id: "transport-layer", name: "Transport Layer: UDP, TCP, Congestion Control", subtopics: ["TCP connection setup/teardown", "Flow control (sliding window)", "TCP congestion window adjustment"] },
          { id: "application-layer", name: "Application Protocols", subtopics: ["DNS query resolution", "HTTP, SMTP, POP, FTP", "Web sockets"] }
        ]
      }
    ]
  }
];
