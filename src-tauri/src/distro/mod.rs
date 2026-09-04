use crate::models::DistroInfo;

pub fn get_supported_distros() -> Vec<DistroInfo> {
    vec![
        DistroInfo {
            id: "ubuntu".to_string(),
            name: "Ubuntu 24.04 LTS (Noble Numbat)".to_string(),
            version: "24.04".to_string(),
            kernel: "Linux 6.8.0-45-generic x86_64".to_string(),
            default_user: "user".to_string(),
            package_manager: "apt".to_string(),
            color_theme: "#E95420".to_string(),
            ascii_logo: r#"            .-/+oossssoo+/-.
        `:+ssssssssssssssssss+:`
      -+ssssssssssssssssssyyssss+-
    .ossssssssssssssssssdMMMNysssso.
   /ssssssssssshdmmNNmmyNMMMMhssssss/
  +ssssssssshmydMMMMMMMNddddyssssssss+
 /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/
.ssssssssdMMMNhsssssssssshNMMMdssssssss.
+sssshhhyNMMNyssssssssssssyNMMMysssssss+
ossyNMMMNyMMhsssssssssssssshmmmhssssssso
ossyNMMMNyMMhsssssssssssssshmmmhssssssso
+sssshhhyNMMNyssssssssssssyNMMMysssssss+
.ssssssssdMMMNhsssssssssshNMMMdssssssss.
 /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/
  +sssssssssdmydMMMMMMMMddddyssssssss+
   /ssssssssssshdmNNNNmyNMMMMhssssss/
    .ossssssssssssssssssdMMMNysssso.
      -+sssssssssssssssssyyyssss+-
        `:+ssssssssssssssssss+:`
            .-/+oossssoo+/-."#.to_string(),
            description: "La référence des distributions Linux pour postes de travail et serveurs d'entreprise.".to_string(),
            default_packages: vec!["bash", "coreutils", "systemd", "apt", "python3", "git", "curl"].into_iter().map(String::from).collect(),
        },
        DistroInfo {
            id: "arch".to_string(),
            name: "Arch Linux (Rolling Release)".to_string(),
            version: "Rolling".to_string(),
            kernel: "Linux 6.10.8-arch1-1 x86_64".to_string(),
            default_user: "archuser".to_string(),
            package_manager: "pacman".to_string(),
            color_theme: "#1793D1".to_string(),
            ascii_logo: r#"                   -`
                  .o+`
                 `ooo/
                `+oooo:
               `+oooooo:
               -+oooooo+:
             `/:-:++oooo+:
            `/++++/+++++++:
           `/++++++++++++++:
          `/+++ooooooooooooo/`
         ./ooosssso++osssssso+`
        .oossssso-````/ossssss+`
       -osssssso.      :ssssssso.
      :osssssss/        ossso+++o:
     /ossssssss/        +ssssooo/-
   `/ossssso+/:-        -:/+osssso+-
  `+sso+:-`                 `.-/+oso:
 `++:.                           `-/+/
 .`                                 `"#.to_string(),
            description: "Distribution minimaliste et ultra-légère 'Bleeding Edge' avec pacman et l'AUR.".to_string(),
            default_packages: vec!["base", "base-devel", "pacman", "linux", "systemd", "neovim"].into_iter().map(String::from).collect(),
        },
        DistroInfo {
            id: "debian".to_string(),
            name: "Debian GNU/Linux 12 (Bookworm)".to_string(),
            version: "12".to_string(),
            kernel: "Linux 6.1.0-25-amd64 x86_64".to_string(),
            default_user: "debian".to_string(),
            package_manager: "apt".to_string(),
            color_theme: "#A80030".to_string(),
            ascii_logo: r#"       _,met$$$$$gg.
    ,g$$$$$$$$$$$$$$$P.
  ,g$$P"     """Y$$.".
 ,$$P'              `$$$.
',$$P       ,ggs.     `$$b:
`d$$'     ,$P"'   .    $$$
 $$P      d$'     ,    $$P
 $$:      $$.   -    ,d$$'
 $$;      Y$b._   _,d$P'
 Y$$.    `.`"Y$$$$P"'
 `$$b      "-.__
  `Y$$
   `Y$$.
     `$$b.
       `Y$$b.
          `"Y$b._
              `"""#.to_string(),
            description: "Le système d'exploitation universel, reconnu mondialement pour son ultra-stabilité.".to_string(),
            default_packages: vec!["apt", "dpkg", "systemd", "coreutils", "cron"].into_iter().map(String::from).collect(),
        },
        DistroInfo {
            id: "alpine".to_string(),
            name: "Alpine Linux v3.20".to_string(),
            version: "3.20".to_string(),
            kernel: "Linux 6.6.47-0-lts x86_64 (musl)".to_string(),
            default_user: "root".to_string(),
            package_manager: "apk".to_string(),
            color_theme: "#0D597F".to_string(),
            ascii_logo: r#"   .alpinemount.
  /             \
 /               \
/        /\       \
\       /  \      /
 \     /    \    /
  \   /      \  /
   \ /        \/
    V"#.to_string(),
            description: "Distribution ultra-compacte (5 Mo) basée sur musl libc et BusyBox, reine des conteneurs.".to_string(),
            default_packages: vec!["apk-tools", "busybox", "musl", "alpine-base"].into_iter().map(String::from).collect(),
        },
        DistroInfo {
            id: "kali".to_string(),
            name: "Kali Linux (Rolling)".to_string(),
            version: "2024.3".to_string(),
            kernel: "Linux 6.8.11-kali-amd64 x86_64".to_string(),
            default_user: "kali".to_string(),
            package_manager: "apt".to_string(),
            color_theme: "#557C94".to_string(),
            ascii_logo: r#"..............
            ..,;:ccc,.
          ......''';lxO.
.....''''..........,:ld;
           .';;;:::;,,.x,
      ..'''.            0Xxoc:,.
  ....                ,ONkc;,;lol.
 .                   d0Ed poll ok
                    .W'...,:...0c
                    ;k   :oko:.'x
                    'd  ,odxkd. cd  .
                     .goo:lo;     .d#
                      .   .         :LGN"#.to_string(),
            description: "Plateforme professionnelle pour tests d'intrusion, audit de vulnérabilités et rétro-ingénierie.".to_string(),
            default_packages: vec!["nmap", "wireshark", "metasploit", "aircrack-ng", "burpsuite"].into_iter().map(String::from).collect(),
        },
        DistroInfo {
            id: "fedora".to_string(),
            name: "Fedora 40 (Workstation Edition)".to_string(),
            version: "40".to_string(),
            kernel: "Linux 6.9.7-200.fc40.x86_64".to_string(),
            default_user: "fedora".to_string(),
            package_manager: "dnf".to_string(),
            color_theme: "#294172".to_string(),
            ascii_logo: r#"             .',;::::;,'.
         .';:cccccccccccc:;'.
       .;cccccccccccccccccccc;.
      .:cccccccccccccccccccccc:.
     .:ccccccccccccc;.:dddl:.;cc:.
    .:ccccccccccccc;OWWWWWWWddl:c:.
   .:ccccccccccccc;oMMMMMMMWkoolccc:.
   .:ccccccccccccc;oMMMMMMMWkoolccc:.
   .:ccccccccccccc;oMMMMMMMWkoolccc:.
    .:ccccccccccccc;OWWWWWWWddl:c:.
     .:ccccccccccccc;.:dddl:.;cc:.
      .:cccccccccccccccccccccc:.
       .;cccccccccccccccccccc;.
         .';:cccccccccccc:;'.
             .',;::::;,'."#.to_string(),
            description: "Le laboratoire d'innovation Red Hat Enterprise Linux avec Wayland, PipeWire et DNF 5.".to_string(),
            default_packages: vec!["dnf", "rpm", "systemd", "wayland", "pipewire", "podman"].into_iter().map(String::from).collect(),
        }
    ]
}

pub fn get_distro_by_id(id: &str) -> Option<DistroInfo> {
    get_supported_distros().into_iter().find(|d| d.id == id)
}
