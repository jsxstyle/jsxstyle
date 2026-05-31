use std::path::PathBuf;

use swc_core::ecma::{
    parser::{Syntax, TsSyntax},
    transforms::testing::test_fixture,
};
use swc_core::testing::fixture;

#[fixture("tests/fixture/**/input.tsx")]
fn fixture(input: PathBuf) {
    let output = input.parent().unwrap().join("output.tsx");
    test_fixture(
        Syntax::Typescript(TsSyntax {
            tsx: true,
            ..Default::default()
        }),
        &|_tester| jsxstyle_swc_core::create_transform(),
        &input,
        &output,
        Default::default(),
    );
}
