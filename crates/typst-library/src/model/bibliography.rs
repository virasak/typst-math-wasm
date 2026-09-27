use std::collections::HashMap;
use std::sync::Arc;
use ecow::EcoString;
use comemo::Tracked;
use typst_syntax::{Span, Spanned};

use crate::diag::{bail, SourceResult, StrResult};
use crate::engine::Engine;
use crate::foundations::{
    cast, elem, Content, Derived, Label, OneOrMultiple, Packed, Show, ShowSet, StyleChain, Styles,
};
use crate::introspection::{Introspector, Locatable, Location};
use crate::loading::DataSource;
use crate::text::{Lang, LocalName, Region};
use crate::World;

#[elem(Locatable, Show, ShowSet, LocalName)]
pub struct BibliographyElem {
    #[required]
    #[parse(
        let _ = args.expect::<OneOrMultiple<DataSource>>("sources")?;
        Derived::new(OneOrMultiple(vec![DataSource::Path(EcoString::new())]), ())
    )]
    pub sources: Derived<OneOrMultiple<DataSource>, ()>,
    pub title: Option<Content>,
    #[default(false)]
    pub full: bool,
    #[parse(match args.named::<Spanned<CslSource>>("style")? {
        Some(_) => Some(Derived::new(CslSource::Normal(DataSource::Path(EcoString::new())), CslStyle)),
        None => None,
    })]
    #[default(Derived::new(CslSource::Normal(DataSource::Path(EcoString::new())), CslStyle))]
    pub style: Derived<CslSource, CslStyle>,
    #[internal]
    #[synthesized]
    pub lang: Lang,
    #[internal]
    #[synthesized]
    pub region: Option<Region>,
}

impl Show for Packed<BibliographyElem> {
    fn show(&self, _engine: &mut Engine, _styles: StyleChain) -> SourceResult<Content> {
        bail!(self.span(), "bibliography is not supported in typst-math-wasm");
    }
}

impl ShowSet for Packed<BibliographyElem> {
    fn show_set(&self, _: StyleChain) -> Styles {
        Styles::new()
    }
}

impl LocalName for Packed<BibliographyElem> {
    const KEY: &'static str = "bibliography";
}

impl BibliographyElem {
    pub fn find(_introspector: Tracked<Introspector>) -> StrResult<Packed<Self>> {
        Err("no bibliography in document".into())
    }
    pub fn has(_engine: &Engine, _target: Label) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Hash)]
pub struct CslStyle;

impl CslStyle {
    pub fn load(
        _world: Tracked<dyn World + '_>,
        _source: Spanned<CslSource>,
    ) -> SourceResult<Derived<CslSource, Self>> {
        bail!(Span::detached(), "CSL styles are not supported in typst-math-wasm");
    }
}

#[derive(Debug, Clone, PartialEq, Hash)]
pub enum CslSource {
    Normal(DataSource),
}

cast! {
    CslSource,
    self => match self {
        Self::Normal(v) => v.into_value(),
    },
    v: DataSource => Self::Normal(v),
}

#[allow(dead_code)]
pub(super) struct Works {
    pub citations: HashMap<Location, SourceResult<Content>>,
    pub references: Option<Vec<(Option<Content>, Content)>>,
    pub hanging_indent: bool,
}

impl Works {
    pub fn generate(_engine: &Engine) -> StrResult<Arc<Works>> {
        Err("citations are not supported in typst-math-wasm".into())
    }
}
