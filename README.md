# PennOS

## 1. Student Info

- **Name:** Zhujie Xu  
    - **PennKey:** xu1573

- **Name:** Sihan Wang
    - **PennKey:** wang031

- **Name:** Ruoming Wu
    - **PennKey:** rwu331

- **Name:** IreneCui
    - **PennKey:** Cuipy


---

## 2. Submitted Source Files

Everything is under `penn-os/src` unless otherwise noted.

### Top-level kernel / shell

- `pennos.c`  
- `sys_calls.c`
- `sys_calls.h`
- `scheduler.c`
- `scheduler.h`
- `pennfat.c`
- `pennfat_kern.c`
- `pennfat_kern.h`
- `pennos_signal.h`
- `stress.c`
- `stress.h`
- `Job.c`
- `Job.h`
- `parser.c`
- `parser.h`

### Kernel subdirectory

- `kernel/pcb.h`
- `kernel/process.c`
- `kernel/process.h`
- `kernel/timer.c`
- `kernel/timer.h`

### Builtin commands

- `builtin/builtin_file.c`
- `builtin/builtin_file.h`
- `builtin/builtin_job.c`
- `builtin/builtin_job.h`
- `builtin/builtin_proc.c`
- `builtin/builtin_proc.h`

### Utilities

- `util/logger.c`
- `util/logger.h`
- `util/panic.c`
- `util/panic.h`
- `util/Vec.c`
- `util/Vec.h`
- `util/spthread.c`
- `util/spthread.h`

## 3. Overview of Work Accomplished

At a high level we implemented:

1. **Process management & PCB**
   - A global **process table** and a `pcb_t` struct that tracks PID, PPID, state (`P_READY`, `P_RUNNING`, `P_SLEEPING`, `P_STOPPED`, `P_ZOMBIE`), nice level, open file descriptors, wait status, exit code, parent/child links, and the backing `spthread`.
   - Helpers to create processes, link them into the parent’s child list, and safely clean them up (`k_proc_create`, `k_proc_cleanup`, etc.).
   - Orphan handling: when a non-init process exits, its children are reparented to `init` and logged as `ORPHAN`.
   - Zombie handling: when a process finishes, it becomes `P_ZOMBIE` and is logged as `ZOMBIE` until its parent (or `init`, if reparented) calls `s_waitpid(...)`, which logs `WAITED` and frees the PCB via `k_proc_cleanup(...)`.

2. **Scheduler and timer**
   - A **multi-level feedback queue (MLFQ)** scheduler with three queues (`Q0`, `Q1`, `Q2`) and a ticketing policy to approximate a 9:6:4 time-share across nice levels 0, 1, and 2.
   - A **SleepQ** for sleeping processes keyed by `wake_tick`.
   - A periodic `SIGALRM`-driven timer (100ms) that:
     - Increments a global tick counter `g_ticks`.
     - Wakes sleeping processes whose `wake_tick <= g_ticks`.
     - Gives each runnable process one quantum via `spthread_continue` / `spthread_suspend`.
   - `scheduler_add`, `scheduler_remove`, `scheduler_block_current`, and `scheduler_enqueue_sleep` to interact with PCBs.

3. **System call layer (`sys_calls.c`)**
   - **Process syscalls**
     - `s_spawn(parent, func, argv, fd0, fd1)` – creates a new PCB, copies `argv`, inherits the parent’s FDT, and optionally redirects stdin/stdout based on `fd0`/`fd1`.
     - `s_sleep(self, ticks)` – puts the process into `P_SLEEPING`, enqueues on `SleepQ`, and yields the CPU.
     - `s_waitpid(self, pid, wstatus, nohang)` – waits for a specific child (`pid > 0`) or any child (`pid == -1`), supporting both blocking and non-blocking (WNOHANG-like) behavior.
     - `s_exit(self, code)` – sets exit code and wait status, marks the process `P_ZOMBIE`, wakes a blocked parent if any, then terminates the thread.
   - **Priority / scheduling**
     - `s_nice(pid, new_nice)` – clamps to `[0,2]`, updates PCB’s nice value, and requeues the process if it is currently in a ready queue.
   - **Signals**
     - `s_kill(pid, signal)` – implements `P_SIGSTOP`, `P_SIGCONT`, `P_SIGTERM`, and `P_SIGINT`:
       - `P_SIGSTOP` moves the target to `P_STOPPED` and preserves remaining sleep time if it was sleeping.
       - `P_SIGCONT` either resumes a paused sleep or requeues the process as `P_READY`.
       - `P_SIGTERM` / `P_SIGINT` mark the process as killed by signal and place it in `P_ZOMBIE`.
       - Parents blocked in `s_waitpid` are woken when their child changes to a waitable state.
   - **File system / PennFAT**
     - `s_open`, `s_close`, `s_read`, `s_write`, `s_ls`, `s_chmod`, `s_unlink`, `s_rename` wrap the PennFAT kernel functions (`k_open`, `k_close`, `k_read`, `k_write`, `k_ls`, `k_chmod`, `k_unlink`, `k_rename`).
     - File descriptors are managed via a per-process FDT (`proc->fdt`) that indexes entries in a global open file table (`g_fd_table`).
     - Special-cases: if stdout (fd 1) or stdin (fd 0) have no PennFAT redirection, I directly use `read`/`write` on the host terminal.

4. **PennFAT Filesystem**
   - `pennfat.c` implements a standalone interactive shell for PennFAT and enables commands like `mkfs`, `mount`, `umount`, `ls`, `cp`, `cat`, `touch`, `rm`, `mv`, `chmod`.
   - `pennfat_kern.c` implements the core PennFAT kernel functions:
     - Defines the global mount state and global open file table
     - Implements the PennFAT kernel functions like `k_mount`, `k_unmount`, `k_open`, `k_read`, `k_write`, `k_close`, `k_unlink`, `k_lseek`, `k_ls`, `k_chmod`, `k_rename`.
  
5. **Shell, parsing, and jobs**
   - `pennos.c` sets up the kernel, starts the scheduler, creates the `init` and `shell` processes, and runs the main shell loop.
   - `parser.c` tokenizes the user input into commands, arguments, and redirections.
   - `Job.c` and `builtin_job.c` implement job tracking and job-related builtins (e.g., `jobs`, `fg`, `bg`, `kill`, `nice`, `ps`), integrating with the process abstraction and `s_kill` / `s_waitpid`.
   - `builtin_proc.c` implements process-type commands like `sleep`, `busy`, `echo`, etc.
   - `builtin_file.c` implements file-system builtins like `ls`, `touch`, `cp`, `mv`, `rm`, `chmod`.

6. **Logging and debugging**
   - `logger.c` records scheduling and process events such as:
     - `BLOCKED`, `UNBLOCKED`, `ZOMBIE`, `WAITED`, `STOPPED`, `CONTINUED`, `SIGNALED`, and `ORPHAN`.
   - The log helped debug:
     - Correct wake-up behavior for `s_waitpid` (parent transitions from `P_BLOCKED` back to `P_READY`).
     - Sleep / wake behavior for `SleepQ`.
     - Adoption of orphaned children by `init`.


## 4. Code Layout and How Things Fit Together

**Boot sequence**

1. `main` (in `pennos.c`) initializes the logger, process table, and scheduler.
2. The kernel creates the `init` process (PID 1) and starts `scheduler_run` in its own thread.
3. `init` creates the `shell` process (PID 2) using `s_spawn`.
4. The shell loop:
   - Reads a line from stdin.
   - Uses `parser.c` to build an internal representation (arguments, redirections, background/foreground).
   - Either:
     - Runs a **builtin** directly (e.g., `cd`, `ls`, `jobs`, `cat`, `nohang`, `recur`, `crash`), or
     - Calls `s_spawn` to create a new process for user commands, then uses `s_waitpid` (blocking for foreground jobs, non-blocking for background jobs) to manage them.

**Process lifecycle**

- New processes start as `P_READY` and are placed in the appropriate queue based on `nice`.
- The scheduler:
  - Picks a queue using the ticket policy.
  - Runs the front process for one quantum (100ms).
  - On quantum expiry:
    - If the process is still runnable, it is requeued at the tail of its queue (RR).
    - If it is sleeping, stopped, or zombie, it is not requeued.
- Termination:
  - A process calls `s_exit` explicitly or returns from its entry function.
  - It is marked `P_ZOMBIE` and its parent is woken if blocked in `s_waitpid`.
  - When the parent eventually calls `s_waitpid` and finds the child `P_ZOMBIE`, `k_proc_cleanup` frees the PCB and reassigns any children.

**File system integration**

- Shell commands like `mount`, `ls`, `cp`, `mv`, `rm`, `chmod` go through `s_*` syscalls into `pennfat_kern.c`.
- Redirection in the shell (`cmd > file`, `cmd < file`) is implemented by:
  - Opening the appropriate PennFAT file using `s_open`.
  - Mapping shell’s stdin/stdout FDs (0,1) to the target FDT entries when calling `s_spawn`.
  - Child processes read/write using `s_read`/`s_write`, which route to either PennFAT or the real terminal.

---

## 5. How to Build and Run

From the `penn-os` directory:

```bash
make -B          # build everything
./bin/pennos     # start PennOS
./bin/pennfat    # start PennFAT standalone shell
```

Dependencies:
- clang-15
- POSIX threads (pthread)
- mmap (for FAT loading)
- POSIX signals (SIGALRM, sigsuspend)


## 6. Supported Shell Built-in Commands
Our shell supports the following built-ins, and each implemented as a separate PennOS spthread:

**Process / Job control**
  - `jobs`: list all background jobs
  - `fg %id`: bring job to foreground
  - `bg %id`: continue a stopped job in background
  - `kill`: send P_SIGTERM
  - `nice pid priority`: adjust scheduling priority
  - `ps`: list all PCBs

**Utility programs**
  - `cat`
  - `sleep`
  - `busy`
  - `echo`

**File-related builtins (via PennFAT syscalls)**
  - `ls`
  - `touch`
  - `rm`
  - `mv`
  - `cp`
  - `chmod`

**Redirection**
  - `< file`
  - `> file`
  - `>> file`

**Terminal control**
  - Only the foreground process may read from stdin; background readers receive `P_SIGSTOP`.

## 7. Deviations & Design Decisions

1. **Process Naming Convention**
   - Child processes created by the shell are named "user_proccess" rather than a spec-defined name.
   - This has no effect on scheduling or correctness.

2. **STOP/CONT Behavior on Sleeping Processes**
   - If a sleeping process receives P_SIGSTOP, we store:
      - sleep_remaining
      - sleep_paused = true
   - On `P_SIGCONT`, the process resumes sleeping with the remaining ticks.
   - This behavior matches POSIX–style sleep interruption semantics but is not explicitly required by the spec.

3. **Output Redirection Fallback**
   - If stdout (`fd1`) is not a PennFAT file, which means no redirection occurred,
      - `s_write` falls back to writing to the terminal using host output.
   - This maintains usability but deviates from a fully virtualized I/O environment.

4. **Permission Enforcement in k_open / k_write**
   - PennFAT enforces (since the spec does not mandate exact behavior, we decide to do the following):
      - no write if perm lacks W
      - no read if perm lacks R

5. **Script Execution Semantics**
   - Shell scripts execute sequentially via repeated spawn.
   - Under certain redirection patterns, order may vary from bash (which is a known issues).

6. **Filesystem Error Codes**
   - our design choice to have the following error codes:
      - `FS_NOT_MOUNTED`
      - `FILE_NOT_FOUND`
      - `PERMISSION_DENIED`
      - `INVALID_ARG`

7. **Write Lock Semantics**
   - Only one `F_WRITE` instance per file is allowed globally.
   - Multiple `F_READ` are allowed.

8. **INIT Process Behavior**
   - INIT continuously calls `waitpid(-1, ...)` to reap orphans.
   - We explicitly log ORPHAN adoption events.

## 8. Known Issues & Limitations

1. Unlink Semantics
- A file with active open FDs cannot be deleted (correct), but reclaimed FAT blocks are not zeroed until future allocation.

2. Error Messages
- Behavior is correct, but error strings may not match exact bash wording.
