"""Read-only project inventory and existing validation entry point.

python scripts/manage-project.py inventory
python scripts/manage-project.py check [--browser]
"""
from pathlib import Path
from collections import defaultdict
import argparse, json, shutil, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / '_local/management'

def inventory():
    groups = defaultdict(lambda: {'files': 0, 'bytes': 0})
    assets = []
    for directory in ROOT.iterdir():
        if directory.name == '.git':
            continue
        files = directory.rglob('*') if directory.is_dir() else [directory]
        for path in files:
            if not path.is_file():
                continue
            size = path.stat().st_size
            key = directory.name if directory.is_dir() else '(root files)'
            groups[key]['files'] += 1
            groups[key]['bytes'] += size
            if directory.name in ('images', 'audio', 'video'):
                assets.append({'path': path.relative_to(ROOT).as_posix(), 'bytes': size})
    untracked = subprocess.run(['git', 'ls-files', '--others', '--exclude-standard', '-z'], cwd=ROOT, check=True, capture_output=True).stdout.decode('utf-8').split('\0')
    missing = subprocess.run(['git', 'ls-files', '--deleted', '-z'], cwd=ROOT, check=True, capture_output=True).stdout.decode('utf-8').split('\0')
    report = dict(folders=dict(groups), largest_assets=sorted(assets, key=lambda p: p['bytes'], reverse=True)[:50], untracked_files=[p for p in untracked if p], missing_tracked_files=[p for p in missing if p])
    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS/'inventory.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    lines = ['프로젝트 파일 관리 현황', '', '폴더 / 파일 수 / 용량(MB)']
    lines += [f"{name}: {data['files']}개 / {data['bytes']/1024**2:.1f} MB" for name, data in sorted(groups.items())]
    lines += ['', '용량이 큰 앱 자료 (상위 50개)']
    lines += [f"{a['bytes']/1024**2:.2f} MB  {a['path']}" for a in report['largest_assets']]
    lines += ['', 'Git에 아직 등록되지 않은 파일 (미사용이라는 뜻은 아님)'] + report['untracked_files']
    lines += ['', 'Git에는 있지만 현재 없는 파일 (자동 복원/삭제하지 않음)'] + report['missing_tracked_files']
    (REPORTS/'파일현황.txt').write_text('\n'.join(lines)+'\n', encoding='utf-8-sig')
    print('Inventory saved: _local/management/inventory.json')
    print(f"Folders: {len(groups)}; untracked files: {len(report['untracked_files'])}; missing tracked files: {len(report['missing_tracked_files'])}")

def check(browser):
    node = shutil.which('node') or str(ROOT/'_local/test-tools/playwright/driver/node.exe')
    if not Path(node).is_file():
        raise SystemExit('Node.js is required for the existing audits.')
    commands = [[node, 'scripts/audit-sticker-books.cjs'], [node, 'scripts/audit-offline.cjs'], ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/audit-assets.ps1'], ['git', 'diff', '--check']]
    if browser:
        commands += [[sys.executable, 'scripts/'+name] for name in ['test-app.py', 'test-sticker-book.py', 'test-home-sticker-books.py', 'test-storage-dress.py', 'test-food-stickers.py']]
    for command in commands:
        print('CHECK:', ' '.join(command), flush=True)
        subprocess.run(command, cwd=ROOT, check=True)
    print('PASS: all requested checks completed. Physical iPad testing is separate.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['inventory', 'check'])
    parser.add_argument('--browser', action='store_true')
    args = parser.parse_args()
    if args.action == 'inventory':
        inventory()
    else:
        check(args.browser)
