use ecow::EcoString;
use typst_syntax::Spanned;

use crate::diag::{bail, SourceResult, StrResult};
use crate::engine::Engine;
use crate::foundations::{cast, func, scope, Bytes, Func, Module, Value};
use crate::loading::DataSource;

#[func(scope)]
pub fn plugin(
    engine: &mut Engine,
    source: Spanned<DataSource>,
) -> SourceResult<Module> {
    let _ = engine;
    bail!(source.span, "plugins are not supported in typst-math-wasm");
}

#[scope]
impl plugin {
    #[func]
    pub fn transition(
        func: PluginFunc,
        #[variadic]
        arguments: Vec<Bytes>,
    ) -> StrResult<Module> {
        func.transition(arguments)
    }
}

#[derive(Debug, Clone, PartialEq, Hash)]
pub struct PluginFunc {
    name: EcoString,
}

impl PluginFunc {
    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn call(&self, _args: Vec<Bytes>) -> StrResult<Bytes> {
        Err("plugins are not supported in typst-math-wasm".into())
    }

    pub fn transition(&self, _args: Vec<Bytes>) -> StrResult<Module> {
        Err("plugins are not supported in typst-math-wasm".into())
    }
}

cast! {
    PluginFunc,
    self => Value::Func(self.into()),
    v: Func => v.to_plugin().ok_or("expected plugin function")?.clone(),
}
